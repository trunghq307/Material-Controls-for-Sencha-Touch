(function() {
    var $timeout = setTimeout;
    Ext.define('Material.helpers.RippleService', {
        //singleton: true,
        attachButtonBehavior: function attachButtonBehavior(scope, element, options) {
            return this.attach(scope, element, Ext.merge({}, {
                isFAB: element.hasCls('md-fab'),
                isMenuItem: element.hasCls('md-menu-item'),
                center: false,
                dimBackground: false
            }, options));
        },
        attachCheckboxBehavior: function attachCheckboxBehavior(scope, element, options) {
            return this.attach(scope, element, Ext.merge({}, {
                center: true,
                dimBackground: false
            }, options));
        },
        attachTabBehavior: function attachTabBehavior(scope, element, options) {
            return this.attach(scope, element, Ext.merge({}, {
                center: false,
                dimBackground: true,
                outline: true
            }, options));
        },
        attach: function attach(scope, element, options) {
            var initialConfig = scope.getInitialConfig();
            if ((initialConfig.noInk || options.noInk) === true) {
                return Ext.emptyFn;
            }
            options = Ext.merge({}, {
                colorElement: element.dom,
                mousedown: true,
                hover: true,
                focus: true,
                center: false,
                mousedownPauseTime: 150,
                dimBackground: false,
                outline: false,
                isFAB: false,
                isMenuItem: false
            }, options);
            var rippleContainer, rippleSize,
                counter = 0,
                ripples = [],
                states = [],
                isActive = false,
                isHeld = false,
                node = element.dom,
                color = parseColor(initialConfig.inkColor || options.inkColor) || parseColor(window.getComputedStyle(options.colorElement).color || 'rgb(0, 0, 0)');
            element.on({
                scope: scope,
                touchstart: function(e) {
                    if (scope.getDisabled()) {
                        return false;
                    }
                    createRipple(e.pageX, e.pageY);
                    isHeld = true;
                },
                touchend: function(e) {
                    isHeld = false;
                    var index = ripples.length - 1;
                    ripple = ripples[index];
                    updateElement(ripple);
                },
                destroy: function() {
                    rippleContainer && rippleContainer.destroy();
                    rippleContainer = null;
                }
            });
            function parseColor(color) {
                if (!color)  {
                    return;
                }
                
                if (color.indexOf('rgba') === 0)  {
                    return color.replace(/\d?\.?\d*\s*\)\s*$/, '0.1)');
                }
                
                if (color.indexOf('rgb') === 0)  {
                    return rgbToRGBA(color);
                }
                
                if (color.indexOf('#') === 0)  {
                    return hexToRGBA(color);
                }
                
                /**
                 * Converts a hex value to an rgba string
                 *
                 * @param {string} hex value (3 or 6 digits) to be converted
                 *
                 * @returns {string} rgba color with 0.1 alpha
                 */
                function hexToRGBA(color) {
                    var hex = color.charAt(0) === '#' ? color.substr(1) : color,
                        dig = hex.length / 3,
                        red = hex.substr(0, dig),
                        grn = hex.substr(dig, dig),
                        blu = hex.substr(dig * 2);
                    if (dig === 1) {
                        red += red;
                        grn += grn;
                        blu += blu;
                    }
                    return 'rgba(' + parseInt(red, 16) + ',' + parseInt(grn, 16) + ',' + parseInt(blu, 16) + ',0.1)';
                }
                /**
                 * Converts rgb value to rgba string
                 *
                 * @param {string} rgb color string
                 *
                 * @returns {string} rgba color with 0.1 alpha
                 */
                function rgbToRGBA(color) {
                    return color.replace(')', ', 0.1)').replace('(', 'a(');
                }
            }
            function removeElement(elem, wait) {
                ripples.splice(ripples.indexOf(elem), 1);
                if (ripples.length === 0) {
                    rippleContainer && rippleContainer.setStyle({
                        backgroundColor: ''
                    });
                }
                $timeout(function() {
                    elem.dom.remove();
                }, wait, false);
            }
            function updateElement(elem) {
                var index = ripples.indexOf(elem),
                    state = states[index] || {},
                    elemIsActive = ripples.length > 1 ? false : isActive,
                    elemIsHeld = ripples.length > 1 ? false : isHeld;
                if (elemIsActive || state.animating || elemIsHeld) {
                    elem.addCls('md-ripple-visible');
                } else if (elem) {
                    elem.removeCls('md-ripple-visible');
                    if (options.outline) {
                        elem.setWidth(rippleSize + 'px');
                        elem.setHeight(rippleSize + 'px');
                        elem.setStyle({
                            marginLeft: (rippleSize * -1) + 'px',
                            marginTop: (rippleSize * -1) + 'px'
                        });
                    }
                    removeElement(elem, options.outline ? 450 : 650);
                }
            }
            /**
             * Creates a ripple at the provided coordinates
             *
             * @param {number} left cursor position
             * @param {number} top cursor position
             *
             * @returns {angular.element} the generated ripple element
             */
            function createRipple(left, top) {
                color = parseColor(element.getAttribute('mdInkRipple')) || parseColor(window.getComputedStyle(options.colorElement).color || 'rgb(0, 0, 0)');
                var container = getRippleContainer(),
                    size = getRippleSize(left, top),
                    css = getRippleCss(size, left, top),
                    elem = getRippleElement(css),
                    index = ripples.indexOf(elem),
                    state = states[index] || {};
                rippleSize = size;
                state.animating = true;
                $timeout(function() {
                    if (options.dimBackground) {
                        container.setStyle({
                            backgroundColor: color
                        });
                    }
                    elem.addCls('md-ripple-placed md-ripple-scaled');
                    if (options.outline) {
                        elem.setStyle({
                            borderWidth: (size * 0.5) + 'px',
                            marginLeft: (size * -0.5) + 'px',
                            marginTop: (size * -0.5) + 'px'
                        });
                    } else {
                        elem.setStyle({
                            left: '50%',
                            top: '50%'
                        });
                    }
                    updateElement(elem);
                    $timeout(function() {
                        state.animating = false;
                        updateElement(elem);
                    }, (options.outline ? 450 : 225), false);
                }, 0, false);
                return elem;
                /**
                 * Creates the ripple element with the provided css
                 *
                 * @param {object} css properties to be applied
                 *
                 * @returns {angular.element} the generated ripple element
                 */
                function getRippleElement(css) {
                    //'<div class="md-ripple" data-counter="' + counter++ + '">'
                    var elem = new Ext.Element(document.createElement('div'));
                    elem.addCls('md-ripple');
                    elem.set({
                        dataCounter: counter++
                    });
                    ripples.unshift(elem);
                    states.unshift({
                        animating: true
                    });
                    container.dom.appendChild(elem.dom);
                    css && elem.setStyle(css);
                    return elem;
                }
                /**
                 * Calculate the ripple size
                 *
                 * @returns {number} calculated ripple diameter
                 */
                function getRippleSize(left, top) {
                    var width = container.getWidth(),
                        height = container.getHeight(),
                        multiplier, size, rect;
                    if (options.isMenuItem) {
                        size = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
                        console.log('menu-item', size);
                    } else if (options.outline) {
                        rect = node.getBoundingClientRect();
                        left -= rect.left;
                        top -= rect.top;
                        width = Math.max(left, width - left);
                        height = Math.max(top, height - top);
                        size = 2 * Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
                    } else {
                        multiplier = options.isFAB ? 1.1 : 0.8;
                        size = Math.max(width, height) * multiplier;
                    }
                    return size;
                }
                /**
                 * Generates the ripple css
                 *
                 * @param {number} the diameter of the ripple
                 * @param {number} the left cursor offset
                 * @param {number} the top cursor offset
                 *
                 * @returns {{backgroundColor: *, width: string, height: string, marginLeft: string, marginTop: string}}
                 */
                function getRippleCss(size, left, top) {
                    var rect,
                        css = {
                            backgroundColor: rgbaToRGB(color),
                            borderColor: rgbaToRGB(color),
                            width: size + 'px',
                            height: size + 'px'
                        };
                    if (options.outline) {
                        css.width = 0;
                        css.height = 0;
                    } else {
                        css.marginLeft = css.marginTop = (size * -0.5) + 'px';
                    }
                    if (options.center) {
                        css.left = css.top = '50%';
                    } else {
                        rect = node.getBoundingClientRect();
                        css.left = Math.round((left - rect.left) / container.getWidth() * 100) + '%';
                        css.top = Math.round((top - rect.top) / container.getHeight() * 100) + '%';
                    }
                    return css;
                    /**
                     * Converts rgba string to rgb, removing the alpha value
                     *
                     * @param {string} rgba color
                     *
                     * @returns {string} rgb color
                     */
                    function rgbaToRGB(color) {
                        return color.replace('rgba', 'rgb').replace(/,[^\)\,]+\)/, ')');
                    }
                }
                /**
                 * Gets the current ripple container
                 * If there is no ripple container, it creates one and returns it
                 *
                 * @returns {angular.element} ripple container element
                 */
                function getRippleContainer() {
                    if (rippleContainer)  {
                        return rippleContainer;
                    }
                    
                    //'<div class="md-ripple-container">'
                    var container = rippleContainer = new Ext.Element(document.createElement('div'));
                    container.addCls('md-ripple-container');
                    element.dom.appendChild(container.dom);
                    return container;
                }
            }
        }
    }, function(RippleService) {
        Material.RippleService = new RippleService();
    });
}());

/**
 *
 * @class Material.components.Button
 * @override Ext.Button
 *
 * This overridden is just to add the ripple effect to the root element of the Button with
 * the help of #{Material.helper.RippleService}
 * */
Ext.define('Material.components.Button', {
    override: 'Ext.Button',
    xtype: 'button',
    //width:'200px !important',
    //height:'200px !important',
    config: {},
    //category: 'raised'
    /* width: '200px',
        height: '200px'*/
    requires: [
        'Material.helpers.RippleService'
    ],
    initialize: function() {
        this.callParent();
        var rippleService = Material.RippleService;
        rippleService.attachButtonBehavior(this, this.element);
        this.element.addCls('md-button');
        return this;
    },
    applyCategory: function(category) {
        var element = this.element;
        element.removeCls([
            'md-flat',
            'md-fab',
            'md-raised'
        ]);
        switch (category) {
            case 'flat':
                element.addCls('md-flat');
                break;
            case 'fab':
                element.addCls('md-fab');
                break;
            default:
                element.addCls('md-raised');
                break;
        }
        return category;
    }
});

Ext.define('Material.components.field.Field', {
    override: 'Ext.field.Field'
});

/**
 *
 * This is an overridden of {@link Ext.MessageBox} to match the definition of Google Material Design.
 *
 */
Ext.define('Material.components.MessageBox', {
    override: 'Ext.MessageBox',
    statics: {
        OK: {
            text: 'OK',
            itemId: 'ok',
            ui: 'action',
            cls: 'md-flat'
        },
        YES: {
            text: 'Yes',
            itemId: 'yes',
            ui: 'action',
            cls: 'md-flat'
        },
        NO: {
            text: 'No',
            itemId: 'no',
            cls: 'md-flat'
        },
        CANCEL: {
            text: 'Cancel',
            itemId: 'cancel',
            cls: 'md-flat'
        },
        OKCANCEL: [
            {
                text: 'Cancel',
                itemId: 'cancel',
                cls: 'md-flat'
            },
            {
                text: 'OK',
                itemId: 'ok',
                ui: 'action',
                cls: 'md-flat'
            }
        ],
        YESNOCANCEL: [
            {
                text: 'Cancel',
                itemId: 'cancel',
                cls: 'md-flat'
            },
            {
                text: 'No',
                itemId: 'no',
                cls: 'md-flat'
            },
            {
                text: 'Yes',
                itemId: 'yes',
                ui: 'action',
                cls: 'md-flat'
            }
        ],
        YESNO: [
            {
                text: 'No',
                itemId: 'no',
                cls: 'md-flat'
            },
            {
                text: 'Yes',
                itemId: 'yes',
                ui: 'action',
                cls: 'md-flat'
            }
        ]
    },
    /**
     * Adds the new {@link Ext.Toolbar} instance into this container.
     * @private
     */
    updateButtons: function(newButtons) {
        var me = this;
        // If there are no new buttons or it is an empty array, set newButtons
        // to false
        newButtons = (!newButtons || newButtons.length === 0) ? false : newButtons;
        if (newButtons) {
            if (me.buttonsToolbar) {
                me.buttonsToolbar.show();
                me.buttonsToolbar.removeAll();
                me.buttonsToolbar.setItems(newButtons);
            } else {
                var layout = {
                        type: 'hbox',
                        pack: 'right',
                        align: 'center'
                    };
                var isFlexed = Ext.theme.name == "CupertinoClassic" || Ext.theme.name == "MountainView" || Ext.theme.name == "Blackberry";
                me.buttonsToolbar = Ext.create('Ext.Toolbar', {
                    docked: 'bottom',
                    defaultType: 'button',
                    defaults: {
                        flex: (isFlexed) ? 1 : undefined,
                        ui: (Ext.theme.name == "Blackberry") ? 'action' : undefined
                    },
                    layout: layout,
                    ui: me.getUi(),
                    cls: me.getBaseCls() + '-buttons',
                    items: newButtons
                });
                me.add(me.buttonsToolbar);
            }
        } else if (me.buttonsToolbar) {
            me.buttonsToolbar.hide();
        }
    }
});

/**
 * @class Material.components.List
 * @override Ext.dataview.List
 *
 * This overridden is to add Material Design's ripple effect into list item or control inside list item.
 * */
Ext.define('Material.components.List', {
    override: 'Ext.dataview.List',
    requires: [
        'Material.helpers.RippleService'
    ],
    /**
     * @private
     * */
    rippleService: null,
    /**
     * This overridden is to add the initialization of private property #{Material.components.List}.rippleService
     * for re-use later on
     *
     * @override
     * */
    initialize: function() {
        this.callParent();
    },
    /**
     * This overridden is to check if this instance is a list of menu items.
     * If so, it will as ripple effect for each menu item.
     *
     * @override
     * */
    createItem: function(config) {
        var item = this.callParent([
                config
            ]),
            initialConfig = this.getInitialConfig();
        /*  if (initialConfig && initialConfig.isMenu === true)*/
        {
            Material.RippleService.attachButtonBehavior(this, item.element, {
                isMenuItem: true
            });
        }
        return item;
    },
    /**
     * This overridden is to check if each item on list contains a checkbox.
     * If so, it will as ripple effect for each checkbox.
     *
     * @override
     * */
    updateListItem: function(item, index, info) {
        this.callParent([
            item,
            index,
            info
        ]);
        var checkbox = item.element.down('.md-checkbox .md-container');
        if (checkbox) {
            this.rippleService.attachCheckboxBehavior(this, checkbox);
        }
    }
});

/**
 * @author Vu Duc Tuyen
 * @public
 *
 * This is a special class for displaying the list of values for the field {@link Material.components.field.Select}.
 *
 */
Ext.define('Material.components.field.SelectPanel', {
    extend: 'Ext.Panel',
    requires: [
        'Material.helpers.RippleService'
    ],
    config: {
        onHide: null
    },
    xtype: 'select-panel',
    hide: function() {
        this.element.addCls('x-hiding');
        var self = this;
        setTimeout(function() {
            self.superclass.hide.call(self);
            var onHide = self.getOnHide();
            if (typeof onHide === 'function') {
                onHide.call(self);
            }
            self.element.removeCls('x-top x-right x-left x-bottom x-hiding');
        }, 201);
    },
    showBy: function() {
        this.callParent(arguments);
        this.getModal().addCls('x-mask-select-panel');
    },
    alignTo: function(component, alignment) {
        var alignmentInfo = this.getAlignmentInfo(component, alignment);
        if (alignmentInfo.isAligned)  {
            return;
        }
        
        var alignToBox = alignmentInfo.stats.alignToBox,
            constrainBox = this.getParent().element.getPageBox(),
            height = alignmentInfo.stats.height,
            width = Math.max(alignToBox.width, this.getWidth() || 0),
            topToBottom = alignToBox.bottom - constrainBox.top - 24,
            bottomToTop = constrainBox.bottom - alignToBox.top + 24,
            leftToRight = constrainBox.right - alignToBox.left - 16,
            rightToLeft = alignToBox.right - constrainBox.left + 16,
            realHeight, realWidth,
            self = this;
        setTimeout(function() {
            if (topToBottom >= height || topToBottom >= bottomToTop) {
                realHeight = Math.min(height, topToBottom);
                self.setTop(alignToBox.bottom - realHeight - 2);
                self.setHeight(realHeight);
                self.element.addCls('x-bottom');
            } else {
                realHeight = Math.min(height, bottomToTop);
                self.setTop(alignToBox.top);
                self.setHeight(realHeight);
                self.element.addCls('x-top');
            }
            if (leftToRight >= width || leftToRight >= rightToLeft) {
                realWidth = Math.min(width, leftToRight);
                self.setLeft(alignToBox.left);
                self.setWidth(realWidth);
                self.element.addCls('x-left');
            } else {
                realWidth = Math.min(width, rightToLeft);
                self.setLeft(alignToBox.right - realWidth);
                self.setWidth(realWidth);
                self.element.addCls('x-right');
            }
            self.setCurrentAlignmentInfo(alignmentInfo);
        }, 10);
    }
});

/**
 * @author Vu Duc Tuyen
 * @public
 *
 * This is an overridden of {@link Ext.field.Select} in which we will show up the customized
 * {@link Material.components.field.SelectPanel} rather than the built-in {@Ext.Panel}.
 *
 * Additionally, there is an indicator added to indicate whenever this field is focused or not.
 *
 */
Ext.define('Material.components.field.Select', {
    override: 'Ext.field.Select',
    requires: [
        'Material.components.field.SelectPanel'
    ],
    // @private
    getTabletPicker: function() {
        var config = this.getDefaultTabletPickerConfig(),
            self = this;
        if (!this.listPanel) {
            this.listPanel = Ext.create('Material.components.field.SelectPanel', Ext.apply({
                left: 0,
                top: 0,
                modal: true,
                cls: Ext.baseCSSPrefix + 'select-overlay',
                layout: 'fit',
                hideOnMaskTap: true,
                //width: Ext.os.is.Phone ? '14em' : '18em',
                height: (Ext.os.is.BlackBerry && Ext.os.version.getMajor() === 10) ? '12em' : (Ext.os.is.Phone ? '12.5em' : '22em'),
                items: {
                    xtype: 'list',
                    isMenu: true,
                    store: this.getStore(),
                    itemTpl: '<span class="x-list-label">{' + this.getDisplayField() + ':htmlEncode}</span>',
                    listeners: {
                        select: this.onListSelect,
                        itemtap: this.onListTap,
                        scope: this
                    }
                },
                onHide: function() {
                    self.element.removeCls('x-field-focused');
                }
            }, config));
        }
        return this.listPanel;
    },
    onFocus: function() {
        this.element.addCls('x-field-focused');
        this.callParent(arguments);
    }
});

/**
 * @author FSB
 *
 * Represents a date picker slot in which we will not listen for scroll end event and the title of the slot is
 * always hidden.
 *
 * Additionally, each item on the slot may be a complex one, so the original implementation
 * from the base class is amended to exactly identify the wrapped DOM element.
 *
 * The last thing is that each value associated with an slot item could be a Date, so we have change the equality
 * comparison in that case when searching an item from the underlying store.
 *
 */
Ext.define('Material.components.picker.DatePickerSlot', {
    extend: 'Ext.picker.Slot',
    xtype: 'md-date-picker-slot',
    config: {
        barHeight: 48
    },
    setupBar: function() {
        if (!this.isRendered()) {
            //if the component isnt rendered yet, there is no point in calculating the padding just eyt
            return;
        }
        var element = this.element,
            innerElement = this.innerElement,
            value = this.getValue(),
            showTitle = this.getShowTitle(),
            title = this.getTitle(),
            scrollable = this.getScrollable(),
            scroller = scrollable.getScroller(),
            titleHeight = 0,
            barHeight, padding;
        if (showTitle && title) {
            titleHeight = title.element.getHeight();
        }
        padding = Math.ceil((element.getHeight() - titleHeight - this.getBarHeight()) / 2);
        if (this.getVerticallyCenterItems()) {
            innerElement.setStyle({
                padding: padding + 'px 0 ' + padding + 'px'
            });
        }
        scroller.refresh();
        scroller.setSlotSnapSize(barHeight);
        this.setValue(value);
    },
    onScrollEnd: function(scroller, x, y) {},
    //var me = this,
    //    index = Math.round(y / this.getBarHeight()),
    //    viewItems = me.getViewItems(),
    //    item = viewItems[index];
    //
    //if (item) {
    //    me.selectedIndex = index;
    //    me.selectedNode = item;
    //
    //    me.fireEvent('slotpick', me, me.getValue(), me.selectedNode);
    //}
    doItemTap: function(list, index, item, e) {
        var me = this;
        me.selectedIndex = index;
        me.selectedNode = item;
        me.scrollToItem(item.getY ? item : item.element, true);
        this.fireEvent('slotpick', this, this.getValue(true), this.selectedNode);
    },
    doSetValue: function(value, animated) {
        if (!this.isRendered()) {
            //we don't want to call this until the slot has been rendered
            this._value = value;
            return;
        }
        var store = this.getStore(),
            viewItems = this.getViewItems(),
            valueField = this.getValueField(),
            helper = Material.DatePickerService,
            self = this,
            index, item;
        index = store.findBy(function(record) {
            var fieldValue = record.get(valueField);
            return value instanceof Date ? helper.isEqualMonth(fieldValue, value) : fieldValue === value;
        });
        if (index == -1) {
            index = 0;
        }
        item = Ext.get(viewItems[index]);
        self.selectedIndex = index;
        self.selectedNode = item;
        if (item) {
            if (this._item_scrolling) {
                clearTimeout(this._item_scrolling);
            }
            this._item_scrolling = setTimeout(function() {
                self.scrollToItem(item.getY ? item : item.element, (animated) ? {
                    duration: 100
                } : false);
                self.select(self.selectedIndex);
            }, 250);
        }
        this._value = value;
    }
});

/**
 * @author FSB
 * @public
 *
 * This is a special class to create each calendar item on {@link Material.components.DatePicker}.
 *
 * Each calendar item will have a month title, a week bar header followed by a list of week days called week grid.
 *
 * The week grid is built based on the given value, a valid date. Each cell, a button, on the grid will be a date of
 * the given month. A cell will be marked with CSS class "today" if it holds date value of today. It will be marked
 * with CSS class "selected" if it holds date value of selected date.
 */
Ext.define('Material.components.picker.CalendarItem', {
    extend: 'Ext.Component',
    xtype: 'calendar-item',
    width: '280px',
    height: '250px',
    isComposite: true,
    requires: [
        'Material.helpers.RippleService'
    ],
    template: [
        {
            tag: 'div',
            html: 'February 1989',
            reference: 'headerElement',
            className: 'header'
        },
        {
            tag: 'div',
            className: 'week-bar',
            children: [
                {
                    tag: 'span',
                    text: 'S'
                },
                {
                    tag: 'span',
                    text: 'M'
                },
                {
                    tag: 'span',
                    text: 'T'
                },
                {
                    tag: 'span',
                    text: 'W'
                },
                {
                    tag: 'span',
                    text: 'T'
                },
                {
                    tag: 'span',
                    text: 'F'
                },
                {
                    tag: 'span',
                    text: 'S'
                }
            ]
        },
        {
            tag: 'div',
            className: 'week',
            children: [
                {
                    tag: 'button',
                    text: '1'
                },
                {
                    tag: 'button',
                    text: '2'
                },
                {
                    tag: 'button',
                    text: '3'
                },
                {
                    tag: 'button',
                    text: '4'
                },
                {
                    tag: 'button',
                    text: '5'
                },
                {
                    tag: 'button',
                    text: '6'
                },
                {
                    tag: 'button',
                    text: '7'
                }
            ]
        },
        {
            tag: 'div',
            className: 'week',
            children: [
                {
                    tag: 'button',
                    text: '8'
                },
                {
                    tag: 'button',
                    text: '9'
                },
                {
                    tag: 'button',
                    text: '10'
                },
                {
                    tag: 'button',
                    text: '11'
                },
                {
                    tag: 'button',
                    text: '12'
                },
                {
                    tag: 'button',
                    text: '13'
                },
                {
                    tag: 'button',
                    text: '14'
                }
            ]
        },
        {
            tag: 'div',
            className: 'week',
            children: [
                {
                    tag: 'button',
                    text: '15'
                },
                {
                    tag: 'button',
                    text: '16'
                },
                {
                    tag: 'button',
                    text: '17'
                },
                {
                    tag: 'button',
                    text: '18'
                },
                {
                    tag: 'button',
                    text: '19'
                },
                {
                    tag: 'button',
                    text: '20'
                },
                {
                    tag: 'button',
                    text: '21'
                }
            ]
        },
        {
            tag: 'div',
            className: 'week',
            children: [
                {
                    tag: 'button',
                    text: '22'
                },
                {
                    tag: 'button',
                    text: '23'
                },
                {
                    tag: 'button',
                    text: '24'
                },
                {
                    tag: 'button',
                    text: '25'
                },
                {
                    tag: 'button',
                    text: '26'
                },
                {
                    tag: 'button',
                    text: '27'
                },
                {
                    tag: 'button',
                    text: '28'
                }
            ]
        },
        {
            tag: 'div',
            className: 'week',
            children: [
                {
                    tag: 'button',
                    text: '29'
                },
                {
                    tag: 'button',
                    text: '30'
                },
                {
                    tag: 'button',
                    text: '31'
                },
                {
                    tag: 'button',
                    text: '32'
                },
                {
                    tag: 'button',
                    text: '33'
                },
                {
                    tag: 'button',
                    text: '34'
                },
                {
                    tag: 'button',
                    text: '35'
                }
            ]
        },
        {
            tag: 'div',
            className: 'week',
            children: [
                {
                    tag: 'button',
                    text: '36'
                },
                {
                    tag: 'button',
                    text: '37'
                },
                {
                    tag: 'button',
                    text: '38'
                },
                {
                    tag: 'button',
                    text: '39'
                },
                {
                    tag: 'button',
                    text: '40'
                },
                {
                    tag: 'button',
                    text: '41'
                },
                {
                    tag: 'button',
                    text: '42'
                }
            ]
        }
    ],
    config: {
        baseCls: 'md-calendar-item',
        dataview: null,
        record: null,
        width: '100%'
    },
    initialize: function() {
        this.callParent(arguments);
    },
    /* var rippleService = Material.RippleService;
        rippleService.attachButtonBehavior(this, this.element);*/
    updateRecord: function(newRecord) {
        if (!newRecord) {
            return;
        }
        this._record = newRecord;
        var me = this,
            dataview = me.dataview || this.getDataview(),
            data = dataview.prepareData(newRecord.getData(true), dataview.getStore().indexOf(newRecord), newRecord);
        me.generateWeekGrid(data);
        /**
        * @event updatedata
        * Fires whenever the data of the DataItem is updated.
        * @param {Ext.dataview.component.DataItem} this The DataItem instance.
        * @param {Object} newData The new data.
        */
        me.fireEvent('updatedata', me, data);
    },
    generateWeekGrid: function(data) {
        var helper = Material.DatePickerService,
            currentMonth = data.value,
            weekArray = helper.getWeekArray(currentMonth),
            dayButtons = this.element.query('.week button'),
            headerElement = this.headerElement,
            today = new Date(),
            selectedDate = data.selectedDate || today,
            picker = (this.dataview || this.getDataview()).up('md-date-picker');
        this.element.removeCls('md-4-weeks md-5-weeks md-6-weeks');
        this.element.addCls('md-' + weekArray.length + '-weeks');
        headerElement.setHtml(helper.getFullMonth(currentMonth) + ' ' + currentMonth.getFullYear());
        Ext.each(weekArray, function(weekDays, i) {
            Ext.each(weekDays, function(day, j) {
                var dayButton = Ext.Element.get(dayButtons[j + i * 7]);
                dayButton.removeCls('selected today');
                dayButton.setHtml('&nbsp;');
                dayButton.set({
                    'data-date': null
                }, true);
                if (day instanceof Date) {
                    dayButton.setHtml(day.getDate());
                    dayButton.set({
                        'data-date': day
                    }, true);
                    if (helper.isEqualDate(selectedDate, day)) {
                        dayButton.addCls('selected');
                        picker.lastSelectedDate = dayButton;
                    }
                    if (helper.isEqualDate(today, day)) {
                        dayButton.addCls('today');
                    }
                }
            }, this);
        }, this);
    }
});

Ext.define('Material.helpers.DatePickerService', {
    //singleton: true,
    addDays: function(d, days) {
        var newDate = this.clone(d);
        newDate.setDate(d.getDate() + days);
        return newDate;
    },
    addMonths: function(d, months) {
        var newDate = this.clone(d);
        newDate.setMonth(d.getMonth() + months);
        return newDate;
    },
    clone: function(d) {
        return new Date(d.getTime());
    },
    getDaysInMonth: function(d) {
        var resultDate = this.getFirstDayOfMonth(d);
        resultDate.setMonth(resultDate.getMonth() + 1);
        resultDate.setDate(resultDate.getDate() - 1);
        return resultDate.getDate();
    },
    getFirstDayOfMonth: function(d) {
        return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
    },
    getFullMonth: function(d) {
        var month = d.getMonth();
        switch (month) {
            case 0:
                return 'January';
            case 1:
                return 'February';
            case 2:
                return 'March';
            case 3:
                return 'April';
            case 4:
                return 'May';
            case 5:
                return 'June';
            case 6:
                return 'July';
            case 7:
                return 'August';
            case 8:
                return 'September';
            case 9:
                return 'October';
            case 10:
                return 'November';
            case 11:
                return 'December';
        }
    },
    getShortMonth: function(d) {
        var month = d.getMonth();
        switch (month) {
            case 0:
                return 'Jan';
            case 1:
                return 'Feb';
            case 2:
                return 'Mar';
            case 3:
                return 'Apr';
            case 4:
                return 'May';
            case 5:
                return 'Jun';
            case 6:
                return 'Jul';
            case 7:
                return 'Aug';
            case 8:
                return 'Sep';
            case 9:
                return 'Oct';
            case 10:
                return 'Nov';
            case 11:
                return 'Dec';
        }
    },
    getDayOfWeek: function(d) {
        var dow = d.getDay();
        switch (dow) {
            case 0:
                return 'Sunday';
            case 1:
                return 'Monday';
            case 2:
                return 'Tuesday';
            case 3:
                return 'Wednesday';
            case 4:
                return 'Thursday';
            case 5:
                return 'Friday';
            case 6:
                return 'Saturday';
        }
    },
    getWeekArray: function(d) {
        var dayArray = [];
        var daysInMonth = this.getDaysInMonth(d);
        var daysInWeek;
        var emptyDays;
        var firstDayOfWeek;
        var week;
        var weekArray = [];
        for (var i = 1; i <= daysInMonth; i++) {
            dayArray.push(new Date(d.getFullYear(), d.getMonth(), i));
        }
        
        while (dayArray.length) {
            firstDayOfWeek = dayArray[0].getDay();
            daysInWeek = 7 - firstDayOfWeek;
            emptyDays = 7 - daysInWeek;
            week = dayArray.splice(0, daysInWeek);
            for (var i = 0; i < emptyDays; i++) {
                week.unshift(null);
            }
            
            for (var i = week.length; i < 7; i++) {
                week.push(null);
            }
            weekArray.push(week);
        }
        return weekArray;
    },
    format: function(date) {
        var m = date.getMonth() + 1;
        var d = date.getDate();
        var y = date.getFullYear();
        return m + '/' + d + '/' + y;
    },
    isEqualDate: function(d1, d2) {
        return d1 && d2 && (d1.getFullYear() === d2.getFullYear()) && (d1.getMonth() === d2.getMonth()) && (d1.getDate() === d2.getDate());
    },
    isEqualMonth: function(d1, d2) {
        return d1 && d2 && (d1.getFullYear() === d2.getFullYear()) && (d1.getMonth() === d2.getMonth());
    },
    monthDiff: function(d1, d2) {
        var m;
        m = (d1.getFullYear() - d2.getFullYear()) * 12;
        m += d1.getMonth();
        m -= d2.getMonth();
        return m;
    }
}, function(DatePickerService) {
    Material.DatePickerService = new DatePickerService();
});

Ext.define('Material.components.picker.DateDetailsPanel', {
    extend: 'Ext.Component',
    xtype: 'md-date-details',
    requires: [
        'Material.helpers.DatePickerService',
        'Material.helpers.RippleService'
    ],
    template: [
        {
            tag: 'label',
            className: 'day-of-week',
            reference: 'lblDayOfWeek',
            html: 'Thursday'
        },
        {
            tag: 'div',
            className: 'day-of-month',
            children: [
                {
                    tag: 'button',
                    className: 'month',
                    reference: 'btnMonth',
                    html: 'FEB'
                },
                {
                    tag: 'button',
                    className: 'day',
                    reference: 'btnDay',
                    html: '09'
                },
                {
                    tag: 'button',
                    className: 'year',
                    reference: 'btnYear',
                    html: '1989'
                }
            ]
        }
    ],
    config: {
        baseCls: 'md-date-details',
        selectedDate: null
    },
    initialize: function() {
        this.callParent(arguments);
        /*var rippleService = Material.RippleService;
        rippleService.attachButtonBehavior(this, this.element);*/
        this.setSelectedDate(new Date());
        var showMonthAction = {
                scope: this,
                tap: function() {
                    this.toggleHighlight(true);
                    this.fireEvent('show-month', this);
                }
            };
        this.btnDay.on(showMonthAction);
        this.btnMonth.on(showMonthAction);
        this.btnYear.on({
            scope: this,
            tap: function() {
                this.toggleHighlight(false);
                this.fireEvent('show-year', this);
            }
        });
    },
    applySelectedDate: function(newValue) {
        if (newValue instanceof Date) {
            return newValue;
        }
        return new Date();
    },
    updateSelectedDate: function(newValue, oldValue) {
        var helper = Material.DatePickerService;
        this.updateDisplay(newValue);
    },
    updateDisplay: function(newValue) {
        if (!this.lblDayOfWeek) {
            return;
        }
        var helper = Material.DatePickerService;
        this.lblDayOfWeek.setHtml(helper.getDayOfWeek(newValue));
        this.btnDay.setText(newValue.getDate());
        this.btnMonth.setText(helper.getShortMonth(newValue));
        this.btnYear.setText(newValue.getFullYear());
        this.toggleHighlight(true);
    },
    toggleHighlight: function(switcher) {
        var highLightCls = 'highlight';
        if (switcher) {
            this.btnDay.addCls(highLightCls);
            this.btnMonth.addCls(highLightCls);
            this.btnYear.removeCls(highLightCls);
        } else {
            this.btnDay.removeCls(highLightCls);
            this.btnMonth.removeCls(highLightCls);
            this.btnYear.addCls(highLightCls);
        }
    }
});

/*
 *
 * Represents the date picker as defined by Google Material Design.
 */
Ext.define('Material.components.DatePicker', {
    extend: 'Ext.Sheet',
    xtype: 'md-date-picker',
    requires: [
        'Ext.Toolbar',
        'Ext.Button',
        'Ext.Label',
        'Material.components.picker.DatePickerSlot',
        'Material.components.picker.CalendarItem',
        'Material.components.picker.DateDetailsPanel',
        'Material.helpers.DatePickerService'
    ],
    config: {
        //modal: true,
        baseCls: 'md-date-picker',
        cls: 'x-msgbox x-msgbox-dark',
        ui: 'dark',
        layout: {
            type: 'vbox',
            pack: 'justify',
            align: 'stretched'
        },
        /**
         * @cfg
         * @inheritdoc
         */
        showAnimation: {
            type: 'popIn',
            duration: 250,
            easing: 'ease-out'
        },
        /**
         * @cfg
         * @inheritdoc
         */
        hideAnimation: {
            type: 'popOut',
            duration: 250,
            easing: 'ease-out'
        },
        items: [
            {
                xtype: 'panel',
                itemId: 'main-container',
                cls: 'main-container',
                layout: {
                    type: 'vbox',
                    pack: 'justify',
                    align: 'stretched'
                },
                items: [
                    {
                        xtype: 'md-date-details',
                        itemId: 'md-date-details'
                    },
                    {
                        xtype: 'panel',
                        cls: 'main-panel',
                        itemId: 'main-panel',
                        layout: {
                            type: 'card',
                            animation: 'fade'
                        },
                        items: [
                            {
                                xtype: 'md-date-picker-slot',
                                cls: 'x-picker-slot month-picker',
                                itemId: 'month-picker',
                                barHeight: 270,
                                useComponents: true,
                                defaultType: 'calendar-item',
                                data: [
                                    {
                                        value: new Date(),
                                        selectedDate: new Date()
                                    }
                                ]
                            },
                            {
                                xtype: 'md-date-picker-slot',
                                cls: 'x-picker-slot year-picker',
                                itemId: 'year-picker',
                                barHeight: 72,
                                data: [
                                    {
                                        value: 2015,
                                        text: 2015
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                xtype: 'toolbar',
                docked: 'bottom',
                ui: 'dark',
                itemId: 'button-bar',
                cls: 'x-msgbox-buttons',
                layout: {
                    type: 'hbox',
                    pack: 'right',
                    align: 'center'
                },
                defaults: {
                    type: 'button'
                },
                items: [
                    {
                        text: 'Cancel'
                    },
                    {
                        text: 'OK',
                        ui: 'action'
                    }
                ]
            }
        ],
        orientationMode: 'portrait',
        selectedDate: new Date(),
        yearFrom: new Date().getFullYear() - 50,
        yearTo: new Date().getFullYear() + 50
    },
    initialize: function() {
        this.callParent();
        this.setupEventHandler();
        this.updateYearPicker();
        this.prepareMonthPicker();
        this.showCalendar();
    },
    setupEventHandler: function() {
        this.element.on({
            scope: this,
            delegate: '.md-calendar-item button',
            tap: 'selectDate'
        });
        this.on({
            scope: this,
            delegate: 'toolbar#button-bar button',
            tap: 'onClick'
        });
        this.on({
            'show-month': 'showCalendar',
            delegate: 'md-date-details',
            scope: this
        });
        this.on({
            'show-year': 'showYearList',
            delegate: 'md-date-details',
            scope: this
        });
        this.on({
            tap: 'showYearList',
            delegate: 'panel#selected-date button#year',
            scope: this
        });
        this.on({
            slotpick: 'pickYear',
            delegate: 'md-date-picker-slot#year-picker',
            scope: this
        });
    },
    getMainPanel: function() {
        return this._mainPanel || (this._mainPanel = this.getComponent('main-container').getComponent('main-panel'));
    },
    getYearPicker: function() {
        return this._yearPicker || (this._yearPicker = this.getMainPanel().getComponent('year-picker'));
    },
    getMonthPicker: function() {
        return this._monthPicker || (this._monthPicker = this.getMainPanel().getComponent('month-picker'));
    },
    updateYearPicker: function() {
        var yearFrom = this.getYearFrom(),
            yearTo = this.getYearTo(),
            years = [];
        while (true) {
            years.push({
                text: yearFrom,
                value: yearFrom
            });
            if (yearTo == yearFrom) {
                break;
            }
            yearFrom++;
        }
        this.getYearPicker().getStore().setData(years);
    },
    pickYear: function(sender, selectedYear) {
        var helper = Material.DatePickerService,
            temp = helper.clone(this.getSelectedDate());
        temp.setYear(selectedYear);
        this.setSelectedDate(temp);
        this.showCalendar();
    },
    showCalendar: function() {
        var helper = Material.DatePickerService,
            mainPanel = this.getMainPanel();
        if (mainPanel.calendarShown !== true) {
            mainPanel.setActiveItem(0);
            mainPanel.calendarShown = true;
        }
        this.getMonthPicker().setValue(this.getSelectedDate());
    },
    showYearList: function() {
        var mainPanel = this.getMainPanel();
        var yearList = this.getYearPicker();
        if (mainPanel.calendarShown !== false) {
            mainPanel.setActiveItem(1);
            mainPanel.calendarShown = false;
        }
        yearList.setValue(this.getSelectedDate().getFullYear());
    },
    onClick: function(sender, e) {
        if (sender.getUi() == 'action') {
            this._onDone(this.getSelectedDate());
        }
        this._onHide();
        this.hide();
    },
    selectDate: function(sender, e) {
        var previous = this.lastSelectedDate,
            xsender = sender.target || sender.delegatedTarget;
        if (previous != xsender) {
            var temp = Ext.Element.get(xsender);
            var selectedDate = Date.parse(temp.getAttribute('data-date'));
            if (isNaN(selectedDate)) {
                return;
            }
            this.setSelectedDate(new Date(selectedDate));
            if (previous) {
                Ext.Element.get(previous).removeCls('selected');
            }
            this.lastSelectedDate = xsender;
            temp.addCls('selected');
        }
    },
    applySelectedDate: function(newValue) {
        if (newValue && !(newValue instanceof Date)) {
            newValue = Date.parse(newValue);
        }
        return newValue instanceof Date ? newValue : new Date();
    },
    updateSelectedDate: function(newValue, oldValue) {
        if (newValue instanceof Date) {
            var helper = Material.DatePickerService,
                dateDetailsPanel = this.getComponent('main-container').getComponent('md-date-details');
            dateDetailsPanel.setSelectedDate(newValue);
            this.prepareMonthPicker();
        }
    },
    prepareMonthPicker: function() {
        var helper = Material.DatePickerService,
            selectedDate = this.getSelectedDate(),
            selectedYear = selectedDate.getFullYear();
        if (this._currentYear == selectedYear) {
            Ext.each(this.query('panel#week-grid button'), function(item) {
                if (helper.isEqualDate(item.date, selectedDate)) {
                    item.element.addCls('selected');
                    this.lastSelectedDate = item;
                } else {
                    item.element.removeCls('selected');
                }
            });
            this.getMonthPicker().setValue(selectedDate);
            return;
        }
        this._currentYear = selectedYear;
        var months = [];
        for (var i = 0; i < 12; i++) {
            months.push({
                value: new Date(selectedYear, i, 1, 0, 0, 0),
                selectedDate: selectedDate
            });
        }
        this.getMonthPicker().getStore().setData(months);
        this.getMonthPicker().setValue(selectedDate);
    },
    onOrientationChange: function() {
        var mainContainer = this.getComponent('main-container'),
            newValue = Ext.Viewport.getOrientation();
        this.element.removeCls('landscape portrait');
        if (newValue == 'landscape') {
            mainContainer.getLayout().setOrient('horizontal');
            this.element.addCls('landscape');
        } else {
            mainContainer.getLayout().setOrient('vertical');
            this.element.addCls('portrait');
        }
    },
    show: function(callbacks) {
        if (!callbacks) {
            return;
        }
        //if it has not been added to a container, add it to the Viewport.
        if (!this.getParent() && Ext.Viewport) {
            Ext.Viewport.add(this);
            Ext.Viewport.on({
                orientationchange: this.onOrientationChange,
                scope: this
            });
            this.onOrientationChange();
        }
        this._onDone = callbacks.done || Ext.emptyFn;
        this._onHide = callbacks.hide || Ext.emptyFn;
        this.showCalendar();
        this.callParent();
        return this;
    }
}, function(DatePicker) {
    Ext.onSetup(function() {
        Material.DatePicker = new DatePicker();
    });
});

/**
 * @author Vu Duc Tuyen
 * @public
 *
 * This is an overridden of {@link Ext.field.DatePicker} in which we will show up the customized
 * {@link Material.components.DatePicker} rather than the built-in {@Ext.picker.Date}
 *
 */
Ext.define('Material.components.field.DatePicker', {
    override: 'Ext.field.DatePicker',
    requires: [
        'Material.components.DatePicker'
    ],
    updateValue: function(newValue, oldValue) {
        var me = this;
        // Ext.Date.format expects a Date
        if (newValue !== null) {
            me.getComponent().setValue(Ext.Date.format(newValue, me.getDateFormat() || Ext.util.Format.defaultDateFormat));
            this.toggleValueIndicator(true);
        } else {
            me.getComponent().setValue('');
            this.toggleValueIndicator(false);
        }
        if (!Material.DatePickerService.isEqualDate(newValue, oldValue)) {
            me.fireEvent('change', me, newValue, oldValue);
        }
    },
    getValue: function() {
        return this._value;
    },
    onFocus: function(e) {
        var component = this.getComponent(),
            self = this;
        this.fireEvent('focus', this, e);
        if (Ext.os.is.Android4) {
            component.input.dom.focus();
        }
        component.input.dom.blur();
        if (this.getReadOnly()) {
            return false;
        }
        this.isFocused = true;
        this.element.addCls('x-field-focused');
        Material.DatePicker.setSelectedDate(self.getValue());
        Material.DatePicker.show({
            done: function(selectedDate) {
                self.onDatePickerDone(selectedDate);
            },
            hide: function() {
                self.onDatePickerHide();
            }
        });
    },
    onDatePickerHide: function() {
        this.element.removeCls('x-field-focused');
    },
    onDatePickerDone: function(selectedDate) {
        this.setValue(selectedDate);
    },
    // @private
    destroy: function() {
        this.callSuper(arguments);
    }
});

Ext.define('Material.components.Tab', {
    override: 'Ext.tab.Tab',
    requires: [
        'Material.helpers.RippleService'
    ],
    initialize: function() {
        this.callParent();
        var rippleService = Material.RippleService;
        rippleService.attachTabBehavior(this, this.element, {
            inkColor: '#ffff85'
        });
        this.element.addCls('md-tab');
        return this;
    }
});

/**
 *
 * @class Material.components.Checkbox
 *
 * This class is to define an existing control, checkbox, with a totally template of HTML structure
 * */
Ext.define('Material.components.Checkbox', {
    extend: 'Ext.Component',
    xtype: 'md-checkbox',
    template: [
        {
            tag: 'div',
            reference: 'containerElement',
            className: 'md-container',
            children: [
                {
                    tag: 'div',
                    reference: 'containerElement1',
                    className: 'md-container1',
                    children: [
                        {
                            tag: 'div',
                            reference: 'icon',
                            className: 'md-icon'
                        },
                        {
                            tag: 'div',
                            reference: 'icon2',
                            className: 'md-icon2'
                        },
                        {
                            tag: 'div',
                            reference: 'clip',
                            className: 'md-icon2'
                        }
                    ]
                }
            ]
        }
    ],
    config: {
        baseCls: 'md-checkbox',
        valueChecked: true,
        valueUnchecked: false,
        value: false,
        checkedCls: 'md-checked',
        radioCls: 'md-checkbox-radio',
        nonradioCls: 'md-checkbox-nonradius',
        clipCls: 'md-checkbox-clip',
        type: 'abc'
    },
    initialize: function() {
        this.callParent();
        if (this.getType() == 'radio') {
            this.element.removeCls(this.getBaseCls());
            this.element.addCls(this.getRadioCls());
        } else if (this.getType() == 'nonradius') {
            this.element.removeCls(this.getBaseCls());
            this.element.removeCls(this.getRadioCls());
            this.element.addCls(this.getNonradioCls());
        } else if (this.getType() == 'clip') {
            this.element.removeCls(this.getBaseCls());
            this.element.removeCls(this.getRadioCls());
            this.element.removeCls(this.getNonradioCls());
            this.element.addCls(this.getClipCls());
        }
        this.element.on({
            scope: this,
            tap: 'onTap'
        });
        this.doTap(true);
        var rippleService = Material.RippleService;
        rippleService.attachCheckboxBehavior(this, this.containerElement);
    },
    onTap: function listener(ev) {
        if (this.getDisabled())  {
            return;
        }
        
        this.doTap(false);
    },
    doTap: function(keepOrigin) {
        var checked = undefined,
            newValue = undefined,
            value = this.getValue(),
            valueChecked = this.getValueChecked(),
            valueUnchecked = this.getValueUnchecked();
        if (value == valueChecked) {
            checked = true;
            newValue = valueUnchecked;
        } else if (value == valueUnchecked) {
            check = false;
            newValue = valueChecked;
        }
        if (!keepOrigin) {
            checked = !checked;
            this.setValue(newValue);
        }
        this.render(checked);
    },
    render: function render(checked) {
        var clip = this.clip.dom;
        if (checked) {
            this.element.addCls(this.getCheckedCls());
            this.icon2.dom.style.zIndex = '9';
            clip.style.borderColor = 'transparent';
            var i = 0;
            clip.style.height = 25 + "px";
            clip.style.top = 5 + "px";
            var interval = window.setInterval(function() {
                    clip.style.marginLeft = i + "px";
                    i++;
                    if (i >= 35) {
                        clearInterval(interval);
                    }
                }, 10);
        } else {
            this.element.removeCls(this.getCheckedCls());
            clip.style.marginLeft = "0px";
        }
    }
});

Ext.define('Material.components.Entry', {
    extend: 'Ext.Component',
    xtype: 'md-entry',
    config: {
        value: null,
        label: null
    }
});

/**
 * @class Material.components.ProgressCircular
 *
 * This class is to define an existing control, progress circular in new HTML structure.
 * */
Ext.define('Material.components.ProgressCircular', {
    extend: 'Ext.Mask',
    xtype: 'md-progress-circular',
    config: {
        /**
         * @cfg {Boolean} endless Indicates if it's an endless circular progress (Indeterminate) or not (Determinate)
         * @accessor
         */
        endless: false,
        /**
         * @cfg {Number} value The current progress percentage value
         * @accessor
         * @range 0-100
         */
        value: 0,
        type: 'percent',
        /**
         *
         */
        message: 'Loading'
    },
    getTemplate: function() {
        return [
            {
                tag: 'div',
                reference: 'outerElement',
                cls: 'md-progress-circular',
                children: [
                    {
                        tag: 'div',
                        reference: 'wrapperElement',
                        cls: 'md-spinner-wrapper',
                        children: [
                            //the elements required for the CSS loading {@link #indicator}
                            {
                                tag: 'div',
                                reference: 'innerElement',
                                cls: 'md-inner',
                                children: [
                                    {
                                        tag: 'div',
                                        reference: 'P100',
                                        cls: 'myrounded',
                                        text: '0 %'
                                    },
                                    {
                                        tag: 'div',
                                        cls: 'md-right',
                                        children: [
                                            {
                                                tag: 'div',
                                                reference: 'r',
                                                cls: 'md-half-circle'
                                            }
                                        ]
                                    },
                                    {
                                        tag: 'div',
                                        cls: 'md-left',
                                        children: [
                                            {
                                                tag: 'div',
                                                reference: 'l',
                                                cls: 'md-half-circle'
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ];
    },
    applyEndless: function(endless) {
        var outerElementDom = this.outerElement.dom;
        if (endless === true) {
            outerElementDom.setAttribute('md-mode', 'indeterminate');
        } else {
            outerElementDom.setAttribute('md-mode', 'determinate');
        }
        return endless;
    },
    applyValue: function(value) {},
    /*var outerElementDom = this.outerElement.dom;

         if (value > 100) {
         value = 100;
         } else if (value < 0) {
         value = 0;
         }

         outerElementDom.setAttribute('value', value);

         return value;*/
    initialize: function() {
        this.callParent();
        var outerElementDom = this.outerElement.dom;
        var r = this.r.dom;
        var l = this.l.dom;
        var r_ = -135;
        var l_ = 135;
        var click = true;
        if (this.getType() === 'percent') {
            localStorage.setItem("dem", 0);
            var P = this.P100;
            l.style.webkitTransform = "rotate(" + l_ + "deg)";
            l.style.WebkitTransition = "-webkit-transform 0.1s  ease-out";
            r.style.webkitTransform = "rotate(" + r_ + "deg)";
            r.style.WebkitTransition = "-webkit-transform 0.1s  ease-out";
            // firefox
            l.style.MozTransform = "rotate(" + l_ + "deg)";
            l.style.MozTransition = "-webkit-transform 0.1s  ease-out";
            r.style.MozTransform = "rotate(" + r_ + "deg)";
            r.style.MozTransition = "-webkit-transform 0.1s  ease-out";
            // opera
            l.style.OTransform = "rotate(" + l_ + "deg)";
            l.style.OTransition = "-webkit-transform 0.1s  ease-out";
            r.style.OTransform = "rotate(" + r_ + "deg)";
            r.style.OTransition = "-webkit-transform 0.1s  ease-out";
            this.on("tap", function() {
                if (click) {
                    click = false;
                    localStorage.setItem("dem", 0);
                    r_ = -135;
                    l_ = 135;
                    var interval = window.setInterval(function() {
                            if (parseInt(localStorage.getItem("dem")) >= 100) {
                                clearInterval(interval);
                                click = true;
                            }
                            /*localStorage.setItem("dem",0);
                                      r_=-135;
                                      l_= 135;*/
                            if (parseInt(localStorage.getItem("dem")) <= 50) {
                                // safari and chrome
                                l.style.webkitTransform = "rotate(" + l_ + "deg)";
                                l.style.WebkitTransition = "-webkit-transform 0.1s  ease-out";
                                r.style.webkitTransform = "rotate(" + r_ + "deg)";
                                r.style.WebkitTransition = "-webkit-transform 0.1s  ease-out";
                                // firefox
                                l.style.MozTransform = "rotate(" + l_ + "deg)";
                                l.style.MozTransition = "-webkit-transform 0.1s  ease-out";
                                r.style.MozTransform = "rotate(" + r_ + "deg)";
                                r.style.MozTransition = "-webkit-transform 0.1s  ease-out";
                                // opera
                                l.style.OTransform = "rotate(" + l_ + "deg)";
                                l.style.OTransition = "-webkit-transform 0.1s  ease-out";
                                r.style.OTransform = "rotate(" + r_ + "deg)";
                                r.style.OTransition = "-webkit-transform 0.1s  ease-out";
                                r_ = r_ + 3.6;
                            } else {
                                r_ = 45;
                                l_ = l_ + 3.6;
                                // safari and chrome
                                l.style.webkitTransform = "rotate(" + l_ + "deg)";
                                l.style.WebkitTransition = "-webkit-transform 0.1s  ease-out";
                                r.style.webkitTransform = "rotate(" + r_ + "deg)";
                                r.style.WebkitTransition = "-webkit-transform 0.1s  ease-out";
                                // firefox
                                l.style.MozTransform = "rotate(" + l_ + "deg)";
                                l.style.MozTransition = "-webkit-transform 0.1s  ease-out";
                                r.style.MozTransform = "rotate(" + r_ + "deg)";
                                r.style.MozTransition = "-webkit-transform 0.1s  ease-out";
                                // opera
                                l.style.OTransform = "rotate(" + l_ + "deg)";
                                l.style.OTransition = "-webkit-transform 0.1s  ease-out";
                                r.style.OTransform = "rotate(" + r_ + "deg)";
                                r.style.OTransition = "-webkit-transform 0.1s  ease-out";
                            }
                            P.setText(localStorage.getItem("dem") + '%');
                            localStorage.setItem("dem", parseInt(localStorage.getItem("dem")) + 1);
                        }, 100);
                }
            });
        } else {
            this.P100.setStyle({
                'display': 'none'
            });
            outerElementDom.setAttribute('md-mode', 'indeterminate');
        }
    }
});

Ext.define('Material.components.Slider', {
    extend: 'Ext.Component',
    xtype: 'md-slider',
    template: [
        {
            tag: 'div',
            reference: 'trackContainerElement',
            className: 'md-track-container',
            children: [
                {
                    tag: 'div',
                    reference: 'mdTrachElement',
                    className: 'md-track'
                },
                {
                    tag: 'div',
                    reference: 'mdTrachElementLeft',
                    className: 'track-left'
                },
                {
                    tag: 'div',
                    reference: 'trackFillElement',
                    className: 'md-track md-track-fill'
                },
                {
                    tag: 'div',
                    reference: 'trackFillElementLeft',
                    className: 'left'
                },
                {
                    tag: 'div',
                    reference: 'trackTicksElement',
                    className: 'md-track-ticks'
                }
            ]
        },
        {
            tag: 'div',
            reference: 'thumbContainerElement',
            id: 'thumbContainerElementID',
            className: 'md-thumb-container',
            children: [
                {
                    tag: 'div',
                    reference: 'thumbElement',
                    className: 'md-thumb'
                },
                {
                    tag: 'div',
                    className: 'md-focus-thumb'
                },
                {
                    tag: 'div',
                    className: 'md-focus-ring'
                },
                {
                    tag: 'div',
                    className: 'md-sign'
                },
                {
                    tag: 'div',
                    className: 'md-disabled-thumb'
                }
            ]
        },
        {
            tag: 'div',
            id: 'thumbContainerElementLeftID',
            reference: 'thumbContainerElementLeft',
            className: '.md-thumb-containerLeft',
            children: [
                {
                    tag: 'div',
                    reference: 'thumbElementLeft',
                    className: 'md-thumbL'
                },
                {
                    tag: 'div',
                    className: 'md-focus-thumb'
                },
                {
                    tag: 'div',
                    className: 'md-focus-ring'
                },
                {
                    tag: 'div',
                    className: 'md-sign'
                },
                {
                    tag: 'div',
                    className: 'md-disabled-thumb'
                }
            ]
        }
    ],
    config: {
        baseCls: 'md-slider',
        min: 0,
        max: 100,
        step: 20,
        width: 0,
        value: 0,
        valueLeft: 0,
        typeTick: 'notradius',
        type: 'tick',
        sliderLeftCls: 'md-slider-left'
    },
    updateAll: function() {
        this.refreshSliderDimensions();
        this.render();
        this.renderLeft();
        //----------------trunghq
        this.redrawTicks();
    },
    updateMin: function() {
        this.updateAll();
    },
    applyMin: function(value) {
        return parseFloat(value);
    },
    updateMax: function() {
        this.updateAll();
    },
    applyMax: function(value) {
        return parseFloat(value);
    },
    updateStep: function() {
        this.redrawTicks();
    },
    applyStep: function(value) {
        return parseFloat(value);
    },
    redrawTicks: function() {
        //alert('redrawTicks');
        //if (!this.element.is('.md-discrete')) return;
        if (this.getType() === 'notick' || this.getType() === 'notickSingleRight' || this.getType() === 'notickSingleLeft')  {
            return;
        }
        
        var min = this.getMin(),
            max = this.getMax(),
            step = this.getStep(),
            numSteps = Math.floor((max - min) / step);
        //alert (step);
        if (!this.tickCanvas) {
            this.tickCanvas = document.createElement("DIV");
            this.tickCanvas.style.position = 'absolute';
            // var dimensions = this.getWidth();
            //alert(dimensions);
            this.tickCanvas.style.width = this.getWidth();
            // this.tickCanvas.setHeight('6px');
            var distance;
            for (var i = 0; i <= numSteps; i++) {
                distance = ((this.getWidth() / numSteps) * i) / (1);
                //if(i==0) distance =1;
                //this.tickCtx.fillRect(distance-1, 1, 1, 600);
                var span = document.createElement("Span");
                span.style.position = "absolute";
                // span.style.fontSize=" 15px ";
                // span.style.color="brown";
                span.style.width = "2px";
                span.style.height = "6px";
                if (this.getTypeTick() == "radius") {
                    span.style.width = "6px";
                    span.style.height = "6px";
                    span.style.borderRadius = "50%";
                }
                span.style.background = "#b1ac9c";
                // var t = document.createTextNode(i * step);
                //span.appendChild(t);
                span.style.marginLeft = distance + "px";
                span.style.marginTop = "-4px";
                this.tickCanvas.appendChild(span);
            }
            this.trackTicksElement.appendChild(this.tickCanvas);
        }
        if (!this.tickCanvasText) {
            this.tickCanvasText = document.createElement("DIV");
            this.tickCanvasText.style.marginTop = "-47px";
            this.tickCanvasText.style.width = this.getWidth();
            for (var j = 0; j <= numSteps; j++) {
                if (this.getType() == 'tickSingleRight') {
                    distance = ((this.getWidth() / numSteps) * (numSteps - j)) / (1);
                    var span = document.createElement("Span");
                    span.style.position = "absolute";
                    span.style.color = "white";
                    span.style.background = "transparent";
                    span.style.width = '30px';
                    span.style.height = '30px';
                    span.style.opacity = '0';
                    span.style.webkitTransitionDuration = '0.3s';
                    span.style.MozTransitionDuration = '0.4s';
                    /* span.style.webkitTransitionProperty = 'width';
                    span.style.webkitTransitionProperty = 'height';*/
                    span.style.marginLeft = distance - 15 + "px";
                    //////////////////
                    var span1 = document.createElement("Span");
                    span1.style.position = "absolute";
                    span1.style.fontSize = " 15px ";
                    span1.style.color = "white";
                    span1.style.display = 'inline-block';
                    span1.style.width = '30px';
                    span1.style.height = '30px';
                    span1.style.zIndex = 3;
                    span1.style.borderRadius = '50%';
                    span1.style.background = 'transparent';
                    span1.style.textAlign = "center";
                    span1.style.paddingTop = "4px";
                    var t = document.createTextNode(j * step);
                    span1.appendChild(t);
                    span.appendChild(span1);
                    /////////////
                    var span2 = document.createElement("Span");
                    span2.style.position = "absolute";
                    span2.style.display = 'inline-block';
                    //span2.style.transform = 'scale(1,1.2)';
                    span2.style.transform = 'rotate(135deg)';
                    span2.style.background = '#66BB6c';
                    span2.style.webkitTransitionDuration = '0.3s';
                    span2.style.MozTransitionDuration = '0.4s';
                    /*span2.style.webkitTransitionProperty = 'width';
                    span2.style.webkitTransitionProperty = 'height';*/
                    span2.style.margin = 'auto';
                    //top:0px;
                    span2.style.left = '0px';
                    span2.style.right = '0px';
                    span2.style.bottom = '0px';
                    span2.style.width = '0px';
                    span2.style.height = '0px';
                    span2.style.zIndex = 2;
                    //span2.style.borderRadius= '100% 0 55% 50% / 55% 0 100% 50%';
                    span2.style.borderTopLeftRadius = '50%';
                    span2.style.borderBottomLeftRadius = '50%';
                    span2.style.borderBottomRightRadius = '50%';
                    span.appendChild(span2);
                    this.tickCanvasText.appendChild(span);
                } else {
                    distance = (Math.floor(this.getWidth() * (j / numSteps))) / (1);
                    var span = document.createElement("Span");
                    span.style.position = "absolute";
                    // span.style.fontSize=" 1px ";
                    span.style.color = "white";
                    span.style.background = "transparent";
                    span.style.width = '30px';
                    span.style.height = '30px';
                    span.style.opacity = '0';
                    span.style.webkitTransitionDuration = '0.3s';
                    /* span.style.webkitTransitionProperty = 'width';
                    span.style.webkitTransitionProperty = 'height';*/
                    span.style.MozTransitionDuration = '0.4s';
                    span.style.marginLeft = distance - 15 + "px";
                    //////////////////
                    var span1 = document.createElement("Span");
                    span1.style.position = "absolute";
                    span1.style.fontSize = " 15px ";
                    span1.style.color = "white";
                    span1.style.display = 'inline-block';
                    span1.style.width = '30px';
                    span1.style.height = '30px';
                    span1.style.zIndex = 3;
                    span1.style.borderRadius = '50%';
                    span1.style.background = 'transparent';
                    span1.style.textAlign = "center";
                    span1.style.paddingTop = "4px";
                    var t = document.createTextNode(j * step);
                    span1.appendChild(t);
                    span.appendChild(span1);
                    /////////////
                    var span2 = document.createElement("Span");
                    span2.style.position = "absolute";
                    span2.style.display = 'inline-block';
                    //span2.style.transform = 'scale(1,1.2)';
                    span2.style.transform = 'rotate(135deg)';
                    span2.style.background = '#66BB6c';
                    span2.style.webkitTransitionDuration = '0.3s';
                    span2.style.MozTransitionDuration = '0.4s';
                    /*   span2.style.webkitTransitionProperty = 'width';
                    span2.style.webkitTransitionProperty = 'height';*/
                    span2.style.margin = 'auto';
                    //top:0px;
                    span2.style.left = '0px';
                    span2.style.right = '0px';
                    span2.style.bottom = '0px';
                    span2.style.width = '0px';
                    span2.style.height = '0px';
                    span2.style.zIndex = 2;
                    //span2.style.borderRadius= '100% 0 55% 50% / 55% 0 100% 50%';
                    span2.style.borderTopLeftRadius = '50%';
                    span2.style.borderBottomLeftRadius = '50%';
                    span2.style.borderBottomRightRadius = '50%';
                    span.appendChild(span2);
                    this.tickCanvasText.appendChild(span);
                }
            }
            this.trackContainerElement.appendChild(this.tickCanvasText);
        }
    },
    refreshSliderDimensions: function() {
        this.sliderDimensions = this.trackContainerElement.dom.getBoundingClientRect();
    },
    getSliderDimensions: function() {
        //throttledRefreshDimensions();
        return this.sliderDimensions;
    },
    /**
     * ngModel setters and validators
     */
    setModelValue: function(value) {
        this.setValue(this.minMaxValidator(this.stepValidator(value)));
    },
    setModelValueLeft: function(value) {
        this.setValueLeft(this.minMaxValidator(this.stepValidator(value)));
    },
    updateValue: function(newValue, oldValue) {
        this.render();
        this.fireEvent('change', this, this.thumbElement, newValue, oldValue);
    },
    updateValueLeft: function(newValue, oldValue) {
        this.renderLeft();
        this.fireEvent('change', this, this.thumbElementLeft, newValue, oldValue);
    },
    //-----trunghq---------
    render: function() {
        var min = this.getMin(),
            max = this.getMax(),
            value = this.getValue(),
            percent = (value - min) / (max - min);
        this.setSliderPercent(percent);
    },
    //--------trunghq-----------
    renderLeft: function() {
        var min = this.getMin(),
            max = this.getMax(),
            value = this.getValueLeft(),
            percent = (value - min) / (max - min);
        this.setSliderPercentLeft(percent);
    },
    minMaxValidator: function(value) {
        if (typeof value === 'number' && !isNaN(value)) {
            var min = this.getMin(),
                max = this.getMax();
            return Math.max(min, Math.min(max, value));
        }
    },
    stepValidator: function(value) {
        if (typeof value === 'number' && !isNaN(value)) {
            var step = this.getStep();
            return Math.round(value / step) * step;
        }
    },
    /**
     * @param percent 0-1
     */
    setSliderPercent: function(percent) {
        this.trackFillElement.setWidth((percent * 100) + '%');
        //this.draggable && this.draggable.setOffset((this.getSliderDimensions().width) * percent*(-1), 0);
        /*  if (this.getType() == 'slider-right') {*/
        this.draggable && this.draggable.getTranslatable().translate((-1) * (this.getSliderDimensions().width) * percent, 0);
        /* }
         else if (this.getType() == 'slider-left') {
         this.draggable && this.draggable.getTranslatable().translate((+1) * (this.getSliderDimensions().width) * percent, 0);
         }*/
        //console.log(this.getSliderDimensions().width);
        if (percent === 0) {
            this.element.addCls('md-min');
        } else {
            this.element.removeCls('md-min');
        }
    },
    setSliderPercentLeft: function(percent) {
        this.trackFillElementLeft.setWidth((percent * 100) + '%');
        //this.draggable && this.draggable.setOffset((this.getSliderDimensions().width) * percent*(-1), 0);
        /* if (this.getType() == 'slider-right') {
         this.draggable && this.draggable.getTranslatable().translate((-1) * (this.getSliderDimensions().width) * percent, 0);

         }
         else if (this.getType() == 'slider-left') {*/
        this.draggable && this.draggable.getTranslatable().translate((+1) * (this.getSliderDimensions().width) * percent, 0);
        //}
        //console.log(this.getSliderDimensions().width);
        if (percent === 0) {
            this.element.addCls('md-min');
        } else {
            this.element.removeCls('md-min');
        }
    },
    initialize: function() {
        this.callParent();
        this.element.addCls('md-slider');
        if (this.getType() == 'tickSingleLeft' || this.getType() == 'notickSingleLeft') {
            this.mdTrachElement.setStyle({
                display: 'none'
            });
            this.thumbContainerElement.setStyle({
                display: 'none'
            });
        } else if (this.getType() == 'tickSingleRight' || this.getType() == 'notickSingleRight') {
            this.mdTrachElement.setStyle({
                display: 'none'
            });
            this.thumbContainerElementLeft.setStyle({
                display: 'none'
            });
        } else {
            this.mdTrachElement.setStyle({
                backgroundColor: 'rgb(102,187,106)',
                zIndex: '-10'
            });
            this.mdTrachElementLeft.setStyle({
                backgroundColor: 'rgb(102,187,106)',
                zIndex: '-10'
            });
            this.trackFillElement.setStyle({
                backgroundColor: '#b1ac9c'
            });
            this.trackFillElementLeft.setStyle({
                backgroundColor: '#b1ac9c'
            });
        }
        this.element.on({
            scope: this,
            'touchstart': function(ev) {
                if (this.getType() == 'tickSingleRight' || this.getType() == 'notickSingleRight') {
                    this.draggable = draggable;
                } else if (this.getType() == 'tickSingleLeft' || this.getType() == 'notickSingleLeft') {
                    this.draggable = draggableLeft;
                } else //alert("touchstart");
                {
                    //type range
                    if (ev.target.className === 'md-thumbL') {
                        //alert(ev.target);
                        this.draggable = draggableLeft;
                    } else if (ev.target.className === 'md-thumb') {
                        this.draggable = draggable;
                    }
                }
                if (this.getDisabled())  {
                    return false;
                }
                
                this.isSliding = true;
                this.element.addCls('active');
                this.refreshSliderDimensions();
                //alert(ev.target.id);
                if (this.getType() == 'tickSingleRight' || this.getType() == 'notickSingleRight') {
                    this.onPan(this.element, ev);
                } else if (this.getType() == 'tickSingleLeft' || this.getType() == 'notickSingleLeft') {
                    this.onPanLeft(this.element, ev);
                } else {
                    if (ev.target.className === 'md-thumbL')  {
                        this.onPanLeft(this.element, ev);
                    }
                    else if (ev.target.className === 'md-thumb')  {
                        this.onPan(this.element, ev);
                    }
                    
                }
                // this.onPan(this.element, ev);
                ///////////-----------trunghq----------------//////////////
                ev.stopPropagation();
            },
            'touchend': function(ev) {
                if (this.isSliding && this.element.is('.md-discrete')) {
                    if (this.getType() == 'tickSingleRight' || this.getType() == 'notickSingleRight') {
                        this.onPanEnd(ev);
                    } else if (this.getType() == 'tickSingleLeft' || this.getType() == 'notickSingleLeft') {
                        this.onPanEndLeft(ev);
                    } else {
                        if (ev.target.className === 'md-thumbL') {
                            this.onPanEndLeft(ev);
                        }
                        //------trunghq----------
                        else if (ev.target.className === 'md-thumb') {
                            this.onPanEnd(ev);
                        }
                    }
                }
                this.isSliding = false;
                this.element.removeCls('panning active');
            }
        });
        var draggable = Ext.factory({
                element: this.thumbContainerElement,
                direction: 'horizontal'
            }, Ext.util.Draggable);
        draggable.onBefore({
            dragstart: 'onPanStart',
            drag: 'onPan',
            dragend: 'onPanEnd',
            scope: this
        });
        ///---------------------------------------//
        var draggableLeft = Ext.factory({
                element: this.thumbContainerElementLeft,
                direction: 'horizontal'
            }, Ext.util.Draggable);
        draggableLeft.onBefore({
            dragstart: 'onPanStart',
            drag: 'onPanLeft',
            dragend: 'onPanEndLeft',
            scope: this
        });
        //this.draggable = draggable;
        var self = this;
        self.element.on({
            'resize': 'onResize',
            scope: self
        });
        return this;
    },
    onResize: function() {
        //alert('resize');
        var self = this;
        setTimeout(function() {
            self.refreshSliderDimensions();
            self.updateAll();
        });
    },
    onPanStart: function() {
        if (this.getDisabled())  {
            return false;
        }
        
        if (!this.isSliding)  {
            return;
        }
        
        this.element.addCls('panning');
    },
    onPan: function(sender, ev) {
        if (!this.isSliding)  {
            return false;
        }
        
        this.doSlide(ev.pageX);
        // alert(ev.pageX);
        ev.stopPropagation && ev.stopPropagation();
        return false;
    },
    onPanEnd: function(ev) {
        if (this.element.is('.md-discrete') && !this.getDisabled()) {
            // Convert exact to closest discrete value.
            // Slide animate the thumb... and then update the model value.
            var exactVal = this.percentToValue(this.positionToPercent(ev.center.x));
            var closestVal = this.minMaxValidator(this.stepValidator(exactVal));
            this.setSliderPercent(this.valueToPercent(closestVal));
            this.setModelValue(closestVal);
            ev.stopPropagation && ev.stopPropagation();
            return false;
        }
    },
    onPanLeft: function(sender, ev) {
        if (!this.isSliding)  {
            return false;
        }
        
        this.doSlideLeft(ev.pageX);
        // alert(ev.pageX);
        ev.stopPropagation && ev.stopPropagation();
        return false;
    },
    onPanEndLeft: function(ev) {
        if (this.element.is('.md-discrete') && !this.getDisabled()) {
            // Convert exact to closest discrete value.
            // Slide animate the thumb... and then update the model value.
            var exactVal = this.percentToValue(this.positionToPercentLeft(ev.center.x));
            var closestVal = this.minMaxValidator(this.stepValidator(exactVal));
            this.setSliderPercentLeft(this.valueToPercent(closestVal));
            this.setModelValueLeft(closestVal);
            ev.stopPropagation && ev.stopPropagation();
            return false;
        }
    },
    /**
     * Slide the UI by changing the model value
     * @param x
     */
    doSlide: function(x) {
        this.setModelValue(this.percentToValue(this.positionToPercent(x)));
        var min = this.getMin(),
            max = this.getMax(),
            value = this.getValue();
        var percent;
        percent = (value - min) / (max - min);
        /*if (this.getType() == 'tick') {
            percent = 1-(this.getValue() - min) / (max - min);
            console.log(percent);
        }

        else {
            percent =  (value - min) / (max - min);

        }*/
        var percent1 = (this.getValueLeft() - min) / (max - min);
        var step = this.getStep(),
            numSteps = Math.floor((max - min) / step);
        if (this.tickCanvasText)  {
            for (var i = 0; i <= numSteps; i++) {
                if (this.getType() == 'tick') {
                    if (i / numSteps === percent) {
                        console.log(i / numSteps + "=============" + percent);
                        this.tickCanvasText.childNodes[numSteps - i].style.opacity = '1';
                        this.tickCanvasText.childNodes[numSteps - i].childNodes[1].style.width = '30px';
                        this.tickCanvasText.childNodes[numSteps - i].childNodes[1].style.height = '30px';
                    } else {
                        this.tickCanvasText.childNodes[numSteps - i].childNodes[1].style.width = '0px';
                        this.tickCanvasText.childNodes[numSteps - i].childNodes[1].style.height = '0px';
                        this.tickCanvasText.childNodes[numSteps - i].style.opacity = '0';
                    }
                } else {
                    if (i / numSteps === percent) {
                        this.tickCanvasText.childNodes[i].style.opacity = '1';
                        this.tickCanvasText.childNodes[i].childNodes[1].style.width = '30px';
                        this.tickCanvasText.childNodes[i].childNodes[1].style.height = '30px';
                    } else {
                        this.tickCanvasText.childNodes[i].childNodes[1].style.width = '0px';
                        this.tickCanvasText.childNodes[i].childNodes[1].style.height = '0px';
                        this.tickCanvasText.childNodes[i].style.opacity = '0';
                    }
                }
            };
        }
        
        if (this.getType() == 'tick') {
            for (var i = 0; i <= numSteps; i++) {
                if (i / numSteps === percent1) {
                    this.tickCanvasText.childNodes[i].style.opacity = '1';
                    this.tickCanvasText.childNodes[i].childNodes[1].style.width = '30px';
                    this.tickCanvasText.childNodes[i].childNodes[1].style.height = '30px';
                }
            }
        }
    },
    doSlideLeft: function(x) {
        this.setModelValueLeft(this.percentToValue(this.positionToPercentLeft(x)));
        // console.log(x);
        var min = this.getMin(),
            max = this.getMax(),
            value = this.getValueLeft(),
            percent = (value - min) / (max - min),
            percent1 = (this.getValue() - min) / (max - min),
            step = this.getStep(),
            numSteps = Math.floor((max - min) / step);
        if (this.tickCanvasText)  {
            for (var i = 0; i <= numSteps; i++) {
                if (this.getType() == 'tick') {
                    if (i / numSteps === percent || i / numSteps === 1 - percent1) {
                        this.tickCanvasText.childNodes[i].style.opacity = '1';
                        this.tickCanvasText.childNodes[i].childNodes[1].style.width = '30px';
                        this.tickCanvasText.childNodes[i].childNodes[1].style.height = '30px';
                    } else {
                        this.tickCanvasText.childNodes[i].childNodes[1].style.width = '0px';
                        this.tickCanvasText.childNodes[i].childNodes[1].style.height = '0px';
                        this.tickCanvasText.childNodes[i].style.opacity = '0';
                    }
                } else {
                    if (i / numSteps === percent) {
                        this.tickCanvasText.childNodes[i].style.opacity = '1';
                        this.tickCanvasText.childNodes[i].childNodes[1].style.width = '30px';
                        this.tickCanvasText.childNodes[i].childNodes[1].style.height = '30px';
                    } else {
                        this.tickCanvasText.childNodes[i].childNodes[1].style.width = '0px';
                        this.tickCanvasText.childNodes[i].childNodes[1].style.height = '0px';
                        this.tickCanvasText.childNodes[i].style.opacity = '0';
                    }
                }
            };
        }
        
    },
    /**
     * Slide the UI without changing the model (while dragging/panning)
     * @param x
     */
    adjustThumbPosition: function(x) {},
    /* var exactVal = this.percentToValue(this.positionToPercent(x));
         var closestVal = this.minMaxValidator(this.stepValidator(exactVal));
         this.setSliderPercent(this.positionToPercent(x));*/
    /**
     * Convert horizontal position on slider to percentage value of offset from beginning...
     * @param x
     * @returns {number}
     */
    positionToPercent: function(x) {
        /* if (this.getType() == 'slider-right') {*/
        return Math.max(0, Math.min(1, (this.sliderDimensions.right - x) / (this.sliderDimensions.width)));
    },
    /*}
         else if (this.getType() == 'slider-left') {
         return Math.max(0, Math.min(1, (x - this.sliderDimensions.left) / (this.sliderDimensions.width )));
         }*/
    //  return Math.max(0, Math.min(1, (this.sliderDimensions.right-x) / (this.sliderDimensions.width )));
    // alert(this.sliderDimensions.left);
    // console.log(x);
    // console.log(this.sliderDimensions.left);
    positionToPercentLeft: function(x) {
        /*  if (this.getType() == 'slider-right') {
         return Math.max(0, Math.min(1, (this.sliderDimensions.right - x) / (this.sliderDimensions.width )));
         }
         else if (this.getType() == 'slider-left') {*/
        return Math.max(0, Math.min(1, (x - this.sliderDimensions.left) / (this.sliderDimensions.width)));
    },
    // }
    //  return Math.max(0, Math.min(1, (this.sliderDimensions.right-x) / (this.sliderDimensions.width )));
    // alert(this.sliderDimensions.left);
    // console.log(x);
    // console.log(this.sliderDimensions.left);
    /**
     * Convert percentage offset on slide to equivalent model value
     * @param percent
     * @returns {*}
     */
    percentToValue: function(percent) {
        var min = this.getMin(),
            max = this.getMax();
        return (min + percent * (max - min));
    },
    valueToPercent: function(val) {
        var min = this.getMin(),
            max = this.getMax();
        return (val - min) / (max - min);
    }
});

/**
 * @class Material.components.Toggle
 *
 * Define an existing control, Toggle, in new HTML structure.
 * */
Ext.define('Material.components.Toggle', {
    extend: 'Ext.Component',
    xtype: 'md-toggle',
    requires: [
        'Ext.util.Draggable'
    ],
    template: [
        {
            tag: 'div',
            reference: 'containerElement',
            className: 'md-container',
            children: [
                {
                    tag: 'div',
                    reference: 'barElement',
                    className: 'md-bar'
                },
                {
                    tag: 'div',
                    reference: 'thumbContainerElement',
                    className: 'md-thumb-container',
                    children: [
                        {
                            tag: 'div',
                            reference: 'thumbElement',
                            className: 'md-thumb'
                        }
                    ]
                }
            ]
        }
    ],
    config: {
        baseCls: 'md-switch',
        valueChecked: true,
        valueUnchecked: false,
        value: false,
        checkedCls: 'md-checked',
        checkedCls1: 'md-checked1',
        checkedCls2: 'md-checked2',
        checkedCls3: 'md-checked3',
        codeColor: ''
    },
    initialize: function() {
        this.callParent();
        this.element.addCls('transition');
        var draggable = Ext.factory({
                element: this.thumbContainerElement,
                direction: 'horizontal'
            }, Ext.util.Draggable);
        draggable.onBefore({
            dragstart: 'onDragStart',
            drag: 'onDrag',
            dragend: 'onDragEnd',
            scope: this
        });
        this.element.on({
            scope: this,
            tap: 'onTap',
            resize: 'onResize'
        });
        var rippleService = Material.RippleService;
        rippleService.attachCheckboxBehavior(this, this.thumbElement);
    },
    onResize: function() {
        var self = this;
        setTimeout(function() {
            self.doTap(true);
        });
    },
    onTap: function listener(ev) {
        if (this.getDisabled())  {
            return;
        }
        
        this.doTap(false);
    },
    doTap: function(keepOrigin) {
        var checked = undefined,
            newValue = undefined,
            value = this.getValue(),
            valueChecked = this.getValueChecked(),
            valueUnchecked = this.getValueUnchecked();
        if (value == valueChecked) {
            checked = true;
            newValue = valueUnchecked;
        } else if (value == valueUnchecked) {
            check = false;
            newValue = valueChecked;
        }
        if (!keepOrigin) {
            checked = !checked;
            this.setValue(newValue);
            this.fireEvent('change', this, this.thumbElement, newValue, value);
        }
        this.render(checked);
    },
    render: function render(checked) {
        if (checked) {
            // handler for codeColor
            if (this.getCodeColor() === 1)  {
                this.element.addCls(this.getCheckedCls1());
            }
            else if (this.getCodeColor() === 2)  {
                this.element.addCls(this.getCheckedCls2());
            }
            else if (this.getCodeColor() === 3)  {
                this.element.addCls(this.getCheckedCls3());
            }
            else  {
                this.element.addCls(this.getCheckedCls());
            }
            
            //TODO: should verify carefully on browser
            this.thumbContainerElement.setStyle({
                '-webkit-transform': 'translate3d(' + this.thumbContainerElement.getWidth() + 'px, 0, 0) ',
                '-moz-transform': 'translate3d(' + this.thumbContainerElement.getWidth() + 'px, 0, 0)'
            });
        } else {
            // handler for codeColor
            if (this.getCodeColor() === 1)  {
                this.element.removeCls(this.getCheckedCls1());
            }
            else if (this.getCodeColor() === 2)  {
                this.element.removeCls(this.getCheckedCls2());
            }
            
            if (this.getCodeColor() === 3)  {
                this.element.removeCls(this.getCheckedCls3());
            }
            else  {
                this.element.removeCls(this.getCheckedCls());
            }
            
            //TODO: should verify carefully on browser
            this.thumbContainerElement.setStyle({
                '-webkit-transform': 'translate3d(0, 0, 0)',
                '-moz-transform': 'translate3d(0, 0, 0)'
            });
        }
    },
    onDragStart: function onDragStart(sender, e) {
        if (this.getDisabled())  {
            return false;
        }
        
        this.barX = this.barElement.getX();
        this.element.removeCls('transition');
    },
    onDrag: function onDrag(ev, drag) {},
    onDragEnd: function onDragEnd(sender, e) {
        if (this.getDisabled())  {
            return false;
        }
        
        this.element.addCls('transition');
        var value = this.getValue(),
            endPosition = Math.max(0, e.pageX - this.barX),
            halfDistance = this.barElement.getWidth() / 2,
            isChanged = value && (endPosition < halfDistance) || !value && (endPosition > halfDistance);
        if (isChanged) {
            this.doTap(false);
        } else {
            this.doTap(true);
        }
    }
});

Ext.define('Material.components.field.Text', {
    extend: 'Ext.field.Text',
    requires: [
        'Material.helpers.RippleService'
    ],
    //rippleService: null,
    /**
     * Normally when setting value to text field's placeholder, that value will be set to the inner input's placeholder.
     * However, in Material Design there is no real placeholder for the inner input. The label will be the placeholder
     * when there is no value in the input and isn't focused. The label is gone away or displayed above the input
     * if it gets focused or has value. We will leverage #{Ext.field.Text.placeholder} property to indicate that if
     * placeholder is set,
     *  - it will become the field label,
     *  - the label will be gone away if the input has value or get focused
     *  - it has class x-has-placeholder for styling purpose
     *
     * @override
     * */
    initialize: function() {
        this.callParent();
    },
    //Material.RippleService.attachButtonBehavior(this, this.element);
    updatePlaceHolder: function(newPlaceHolder) {
        if (this.getLabelAlign() == 'top') {
            if (newPlaceHolder && !/^\s+$/.test(newPlaceHolder)) {
                this.setLabel(newPlaceHolder);
                this.renderElement.addCls('x-has-placeholder');
            } else {
                this.renderElement.removeCls('x-has-placeholder');
            }
        } else {
            this.callParent(arguments);
        }
    },
    updateReadOnly: function(newReadOnly) {
        this.callParent(arguments);
        this.element[newReadOnly === true ? 'addCls' : 'removeCls']('x-field-readonly');
    },
    updateValue: function(newValue) {
        this.callParent(arguments);
        this.toggleValueIndicator(newValue);
    },
    doKeyUp: function() {
        this.callParent(arguments);
        this.toggleValueIndicator(this.getValue());
    },
    toggleValueIndicator: function(newValue) {
        var valueValid = newValue !== undefined && newValue !== null && newValue !== "";
        this.element[valueValid ? 'addCls' : 'removeCls']('x-field-has-value');
    }
});

(function() {
    Ext.define('Material.helpers.Constants', {});
}());

/*! Hammer.JS - v2.0.4 - 2014-09-28
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2014 Jorik Tangelder;
 * Licensed under the MIT license */
!function(a, b, c, d) {
    "use strict";
    function e(a, b, c) {
        return setTimeout(k(a, c), b);
    }
    function f(a, b, c) {
        return Array.isArray(a) ? (g(a, c[b], c) , !0) : !1;
    }
    function g(a, b, c) {
        var e;
        if (a)  {
            if (a.forEach)  {
                a.forEach(b, c);
            }
            else if (a.length !== d)  {
                for (e = 0; e < a.length; ) b.call(c, a[e], e, a) , e++;
            }
            else  {
                for (e in a) a.hasOwnProperty(e) && b.call(c, a[e], e, a);
            }
            ;
        }
        
    }
    function h(a, b, c) {
        for (var e = Object.keys(b),
            f = 0; f < e.length; ) (!c || c && a[e[f]] === d) && (a[e[f]] = b[e[f]]) , f++;
        return a;
    }
    function i(a, b) {
        return h(a, b, !0);
    }
    function j(a, b, c) {
        var d,
            e = b.prototype;
        d = a.prototype = Object.create(e) , d.constructor = a , d._super = e , c && h(d, c);
    }
    function k(a, b) {
        return function() {
            return a.apply(b, arguments);
        };
    }
    function l(a, b) {
        return typeof a == kb ? a.apply(b ? b[0] || d : d, b) : a;
    }
    function m(a, b) {
        return a === d ? b : a;
    }
    function n(a, b, c) {
        g(r(b), function(b) {
            a.addEventListener(b, c, !1);
        });
    }
    function o(a, b, c) {
        g(r(b), function(b) {
            a.removeEventListener(b, c, !1);
        });
    }
    function p(a, b) {
        for (; a; ) {
            if (a == b)  {
                return !0;
            }
            
            a = a.parentNode;
        }
        return !1;
    }
    function q(a, b) {
        return a.indexOf(b) > -1;
    }
    function r(a) {
        return a.trim().split(/\s+/g);
    }
    function s(a, b, c) {
        if (a.indexOf && !c)  {
            return a.indexOf(b);
        }
        
        for (var d = 0; d < a.length; ) {
            if (c && a[d][c] == b || !c && a[d] === b)  {
                return d;
            }
            
            d++;
        }
        return -1;
    }
    function t(a) {
        return Array.prototype.slice.call(a, 0);
    }
    function u(a, b, c) {
        for (var d = [],
            e = [],
            f = 0; f < a.length; ) {
            var g = b ? a[f][b] : a[f];
            s(e, g) < 0 && d.push(a[f]) , e[f] = g , f++;
        }
        return c && (d = b ? d.sort(function(a, c) {
            return a[b] > c[b];
        }) : d.sort()) , d;
    }
    function v(a, b) {
        for (var c, e,
            f = b[0].toUpperCase() + b.slice(1),
            g = 0; g < ib.length; ) {
            if (c = ib[g] , e = c ? c + f : b , e in a)  {
                return e;
            }
            
            g++;
        }
        return d;
    }
    function w() {
        return ob++;
    }
    function x(a) {
        var b = a.ownerDocument;
        return b.defaultView || b.parentWindow;
    }
    function y(a, b) {
        var c = this;
        this.manager = a , this.callback = b , this.element = a.element , this.target = a.options.inputTarget , this.domHandler = function(b) {
            l(a.options.enable, [
                a
            ]) && c.handler(b);
        } , this.init();
    }
    function z(a) {
        var b,
            c = a.options.inputClass;
        return new (b = c ? c : rb ? N : sb ? Q : qb ? S : M)(a, A);
    }
    function A(a, b, c) {
        var d = c.pointers.length,
            e = c.changedPointers.length,
            f = b & yb && d - e === 0,
            g = b & (Ab | Bb) && d - e === 0;
        c.isFirst = !!f , c.isFinal = !!g , f && (a.session = {}) , c.eventType = b , B(a, c) , a.emit("hammer.input", c) , a.recognize(c) , a.session.prevInput = c;
    }
    function B(a, b) {
        var c = a.session,
            d = b.pointers,
            e = d.length;
        c.firstInput || (c.firstInput = E(b)) , e > 1 && !c.firstMultiple ? c.firstMultiple = E(b) : 1 === e && (c.firstMultiple = !1);
        var f = c.firstInput,
            g = c.firstMultiple,
            h = g ? g.center : f.center,
            i = b.center = F(d);
        b.timeStamp = nb() , b.deltaTime = b.timeStamp - f.timeStamp , b.angle = J(h, i) , b.distance = I(h, i) , C(c, b) , b.offsetDirection = H(b.deltaX, b.deltaY) , b.scale = g ? L(g.pointers, d) : 1 , b.rotation = g ? K(g.pointers, d) : 0 , D(c, b);
        var j = a.element;
        p(b.srcEvent.target, j) && (j = b.srcEvent.target) , b.target = j;
    }
    function C(a, b) {
        var c = b.center,
            d = a.offsetDelta || {},
            e = a.prevDelta || {},
            f = a.prevInput || {};
        (b.eventType === yb || f.eventType === Ab) && (e = a.prevDelta = {
            x: f.deltaX || 0,
            y: f.deltaY || 0
        } , d = a.offsetDelta = {
            x: c.x,
            y: c.y
        }) , b.deltaX = e.x + (c.x - d.x) , b.deltaY = e.y + (c.y - d.y);
    }
    function D(a, b) {
        var c, e, f, g,
            h = a.lastInterval || b,
            i = b.timeStamp - h.timeStamp;
        if (b.eventType != Bb && (i > xb || h.velocity === d)) {
            var j = h.deltaX - b.deltaX,
                k = h.deltaY - b.deltaY,
                l = G(i, j, k);
            e = l.x , f = l.y , c = mb(l.x) > mb(l.y) ? l.x : l.y , g = H(j, k) , a.lastInterval = b;
        } else  {
            c = h.velocity , e = h.velocityX , f = h.velocityY , g = h.direction;
        }
        
        b.velocity = c , b.velocityX = e , b.velocityY = f , b.direction = g;
    }
    function E(a) {
        for (var b = [],
            c = 0; c < a.pointers.length; ) b[c] = {
            clientX: lb(a.pointers[c].clientX),
            clientY: lb(a.pointers[c].clientY)
        } , c++;
        return {
            timeStamp: nb(),
            pointers: b,
            center: F(b),
            deltaX: a.deltaX,
            deltaY: a.deltaY
        };
    }
    function F(a) {
        var b = a.length;
        if (1 === b)  {
            return {
                x: lb(a[0].clientX),
                y: lb(a[0].clientY)
            };
        }
        
        for (var c = 0,
            d = 0,
            e = 0; b > e; ) c += a[e].clientX , d += a[e].clientY , e++;
        return {
            x: lb(c / b),
            y: lb(d / b)
        };
    }
    function G(a, b, c) {
        return {
            x: b / a || 0,
            y: c / a || 0
        };
    }
    function H(a, b) {
        return a === b ? Cb : mb(a) >= mb(b) ? a > 0 ? Db : Eb : b > 0 ? Fb : Gb;
    }
    function I(a, b, c) {
        c || (c = Kb);
        var d = b[c[0]] - a[c[0]],
            e = b[c[1]] - a[c[1]];
        return Math.sqrt(d * d + e * e);
    }
    function J(a, b, c) {
        c || (c = Kb);
        var d = b[c[0]] - a[c[0]],
            e = b[c[1]] - a[c[1]];
        return 180 * Math.atan2(e, d) / Math.PI;
    }
    function K(a, b) {
        return J(b[1], b[0], Lb) - J(a[1], a[0], Lb);
    }
    function L(a, b) {
        return I(b[0], b[1], Lb) / I(a[0], a[1], Lb);
    }
    function M() {
        this.evEl = Nb , this.evWin = Ob , this.allow = !0 , this.pressed = !1 , y.apply(this, arguments);
    }
    function N() {
        this.evEl = Rb , this.evWin = Sb , y.apply(this, arguments) , this.store = this.manager.session.pointerEvents = [];
    }
    function O() {
        this.evTarget = Ub , this.evWin = Vb , this.started = !1 , y.apply(this, arguments);
    }
    function P(a, b) {
        var c = t(a.touches),
            d = t(a.changedTouches);
        return b & (Ab | Bb) && (c = u(c.concat(d), "identifier", !0)) , [
            c,
            d
        ];
    }
    function Q() {
        this.evTarget = Xb , this.targetIds = {} , y.apply(this, arguments);
    }
    function R(a, b) {
        var c = t(a.touches),
            d = this.targetIds;
        if (b & (yb | zb) && 1 === c.length)  {
            return d[c[0].identifier] = !0 , [
                c,
                c
            ];
        }
        
        var e, f,
            g = t(a.changedTouches),
            h = [],
            i = this.target;
        if (f = c.filter(function(a) {
            return p(a.target, i);
        }) , b === yb)  {
            for (e = 0; e < f.length; ) d[f[e].identifier] = !0 , e++;
        }
        
        for (e = 0; e < g.length; ) d[g[e].identifier] && h.push(g[e]) , b & (Ab | Bb) && delete d[g[e].identifier] , e++;
        return h.length ? [
            u(f.concat(h), "identifier", !0),
            h
        ] : void 0;
    }
    function S() {
        y.apply(this, arguments);
        var a = k(this.handler, this);
        this.touch = new Q(this.manager, a) , this.mouse = new M(this.manager, a);
    }
    function T(a, b) {
        this.manager = a , this.set(b);
    }
    function U(a) {
        if (q(a, bc))  {
            return bc;
        }
        
        var b = q(a, cc),
            c = q(a, dc);
        return b && c ? cc + " " + dc : b || c ? b ? cc : dc : q(a, ac) ? ac : _b;
    }
    function V(a) {
        this.id = w() , this.manager = null , this.options = i(a || {}, this.defaults) , this.options.enable = m(this.options.enable, !0) , this.state = ec , this.simultaneous = {} , this.requireFail = [];
    }
    function W(a) {
        return a & jc ? "cancel" : a & hc ? "end" : a & gc ? "move" : a & fc ? "start" : "";
    }
    function X(a) {
        return a == Gb ? "down" : a == Fb ? "up" : a == Db ? "left" : a == Eb ? "right" : "";
    }
    function Y(a, b) {
        var c = b.manager;
        return c ? c.get(a) : a;
    }
    function Z() {
        V.apply(this, arguments);
    }
    function $() {
        Z.apply(this, arguments) , this.pX = null , this.pY = null;
    }
    function _() {
        Z.apply(this, arguments);
    }
    function ab() {
        V.apply(this, arguments) , this._timer = null , this._input = null;
    }
    function bb() {
        Z.apply(this, arguments);
    }
    function cb() {
        Z.apply(this, arguments);
    }
    function db() {
        V.apply(this, arguments) , this.pTime = !1 , this.pCenter = !1 , this._timer = null , this._input = null , this.count = 0;
    }
    function eb(a, b) {
        return b = b || {} , b.recognizers = m(b.recognizers, eb.defaults.preset) , new fb(a, b);
    }
    function fb(a, b) {
        b = b || {} , this.options = i(b, eb.defaults) , this.options.inputTarget = this.options.inputTarget || a , this.handlers = {} , this.session = {} , this.recognizers = [] , this.element = a , this.input = z(this) , this.touchAction = new T(this, this.options.touchAction) , gb(this, !0) , g(b.recognizers, function(a) {
            var b = this.add(new a[0](a[1]));
            a[2] && b.recognizeWith(a[2]) , a[3] && b.requireFailure(a[3]);
        }, this);
    }
    function gb(a, b) {
        var c = a.element;
        g(a.options.cssProps, function(a, d) {
            c.style[v(c.style, d)] = b ? a : "";
        });
    }
    function hb(a, c) {
        var d = b.createEvent("Event");
        d.initEvent(a, !0, !0) , d.gesture = c , c.target.dispatchEvent(d);
    }
    var ib = [
            "",
            "webkit",
            "moz",
            "MS",
            "ms",
            "o"
        ],
        jb = b.createElement("div"),
        kb = "function",
        lb = Math.round,
        mb = Math.abs,
        nb = Date.now,
        ob = 1,
        pb = /mobile|tablet|ip(ad|hone|od)|android/i,
        qb = "ontouchstart" in a,
        rb = v(a, "PointerEvent") !== d,
        sb = qb && pb.test(navigator.userAgent),
        tb = "touch",
        ub = "pen",
        vb = "mouse",
        wb = "kinect",
        xb = 25,
        yb = 1,
        zb = 2,
        Ab = 4,
        Bb = 8,
        Cb = 1,
        Db = 2,
        Eb = 4,
        Fb = 8,
        Gb = 16,
        Hb = Db | Eb,
        Ib = Fb | Gb,
        Jb = Hb | Ib,
        Kb = [
            "x",
            "y"
        ],
        Lb = [
            "clientX",
            "clientY"
        ];
    y.prototype = {
        handler: function() {},
        init: function() {
            this.evEl && n(this.element, this.evEl, this.domHandler) , this.evTarget && n(this.target, this.evTarget, this.domHandler) , this.evWin && n(x(this.element), this.evWin, this.domHandler);
        },
        destroy: function() {
            this.evEl && o(this.element, this.evEl, this.domHandler) , this.evTarget && o(this.target, this.evTarget, this.domHandler) , this.evWin && o(x(this.element), this.evWin, this.domHandler);
        }
    };
    var Mb = {
            mousedown: yb,
            mousemove: zb,
            mouseup: Ab
        },
        Nb = "mousedown",
        Ob = "mousemove mouseup";
    j(M, y, {
        handler: function(a) {
            var b = Mb[a.type];
            b & yb && 0 === a.button && (this.pressed = !0) , b & zb && 1 !== a.which && (b = Ab) , this.pressed && this.allow && (b & Ab && (this.pressed = !1) , this.callback(this.manager, b, {
                pointers: [
                    a
                ],
                changedPointers: [
                    a
                ],
                pointerType: vb,
                srcEvent: a
            }));
        }
    });
    var Pb = {
            pointerdown: yb,
            pointermove: zb,
            pointerup: Ab,
            pointercancel: Bb,
            pointerout: Bb
        },
        Qb = {
            2: tb,
            3: ub,
            4: vb,
            5: wb
        },
        Rb = "pointerdown",
        Sb = "pointermove pointerup pointercancel";
    a.MSPointerEvent && (Rb = "MSPointerDown" , Sb = "MSPointerMove MSPointerUp MSPointerCancel") , j(N, y, {
        handler: function(a) {
            var b = this.store,
                c = !1,
                d = a.type.toLowerCase().replace("ms", ""),
                e = Pb[d],
                f = Qb[a.pointerType] || a.pointerType,
                g = f == tb,
                h = s(b, a.pointerId, "pointerId");
            e & yb && (0 === a.button || g) ? 0 > h && (b.push(a) , h = b.length - 1) : e & (Ab | Bb) && (c = !0) , 0 > h || (b[h] = a , this.callback(this.manager, e, {
                pointers: b,
                changedPointers: [
                    a
                ],
                pointerType: f,
                srcEvent: a
            }) , c && b.splice(h, 1));
        }
    });
    var Tb = {
            touchstart: yb,
            touchmove: zb,
            touchend: Ab,
            touchcancel: Bb
        },
        Ub = "touchstart",
        Vb = "touchstart touchmove touchend touchcancel";
    j(O, y, {
        handler: function(a) {
            var b = Tb[a.type];
            if (b === yb && (this.started = !0) , this.started) {
                var c = P.call(this, a, b);
                b & (Ab | Bb) && c[0].length - c[1].length === 0 && (this.started = !1) , this.callback(this.manager, b, {
                    pointers: c[0],
                    changedPointers: c[1],
                    pointerType: tb,
                    srcEvent: a
                });
            }
        }
    });
    var Wb = {
            touchstart: yb,
            touchmove: zb,
            touchend: Ab,
            touchcancel: Bb
        },
        Xb = "touchstart touchmove touchend touchcancel";
    j(Q, y, {
        handler: function(a) {
            var b = Wb[a.type],
                c = R.call(this, a, b);
            c && this.callback(this.manager, b, {
                pointers: c[0],
                changedPointers: c[1],
                pointerType: tb,
                srcEvent: a
            });
        }
    }) , j(S, y, {
        handler: function(a, b, c) {
            var d = c.pointerType == tb,
                e = c.pointerType == vb;
            if (d)  {
                this.mouse.allow = !1;
            }
            else if (e && !this.mouse.allow)  {
                return;
            }
            
            b & (Ab | Bb) && (this.mouse.allow = !0) , this.callback(a, b, c);
        },
        destroy: function() {
            this.touch.destroy() , this.mouse.destroy();
        }
    });
    var Yb = v(jb.style, "touchAction"),
        Zb = Yb !== d,
        $b = "compute",
        _b = "auto",
        ac = "manipulation",
        bc = "none",
        cc = "pan-x",
        dc = "pan-y";
    T.prototype = {
        set: function(a) {
            a == $b && (a = this.compute()) , Zb && (this.manager.element.style[Yb] = a) , this.actions = a.toLowerCase().trim();
        },
        update: function() {
            this.set(this.manager.options.touchAction);
        },
        compute: function() {
            var a = [];
            return g(this.manager.recognizers, function(b) {
                l(b.options.enable, [
                    b
                ]) && (a = a.concat(b.getTouchAction()));
            }) , U(a.join(" "));
        },
        preventDefaults: function(a) {
            if (!Zb) {
                var b = a.srcEvent,
                    c = a.offsetDirection;
                if (this.manager.session.prevented)  {
                    return void b.preventDefault();
                }
                
                var d = this.actions,
                    e = q(d, bc),
                    f = q(d, dc),
                    g = q(d, cc);
                return e || f && c & Hb || g && c & Ib ? this.preventSrc(b) : void 0;
            }
        },
        preventSrc: function(a) {
            this.manager.session.prevented = !0 , a.preventDefault();
        }
    };
    var ec = 1,
        fc = 2,
        gc = 4,
        hc = 8,
        ic = hc,
        jc = 16,
        kc = 32;
    V.prototype = {
        defaults: {},
        set: function(a) {
            return h(this.options, a) , this.manager && this.manager.touchAction.update() , this;
        },
        recognizeWith: function(a) {
            if (f(a, "recognizeWith", this))  {
                return this;
            }
            
            var b = this.simultaneous;
            return a = Y(a, this) , b[a.id] || (b[a.id] = a , a.recognizeWith(this)) , this;
        },
        dropRecognizeWith: function(a) {
            return f(a, "dropRecognizeWith", this) ? this : (a = Y(a, this) , delete this.simultaneous[a.id] , this);
        },
        requireFailure: function(a) {
            if (f(a, "requireFailure", this))  {
                return this;
            }
            
            var b = this.requireFail;
            return a = Y(a, this) , -1 === s(b, a) && (b.push(a) , a.requireFailure(this)) , this;
        },
        dropRequireFailure: function(a) {
            if (f(a, "dropRequireFailure", this))  {
                return this;
            }
            
            a = Y(a, this);
            var b = s(this.requireFail, a);
            return b > -1 && this.requireFail.splice(b, 1) , this;
        },
        hasRequireFailures: function() {
            return this.requireFail.length > 0;
        },
        canRecognizeWith: function(a) {
            return !!this.simultaneous[a.id];
        },
        emit: function(a) {
            function b(b) {
                c.manager.emit(c.options.event + (b ? W(d) : ""), a);
            }
            var c = this,
                d = this.state;
            hc > d && b(!0) , b() , d >= hc && b(!0);
        },
        tryEmit: function(a) {
            return this.canEmit() ? this.emit(a) : void (this.state = kc);
        },
        canEmit: function() {
            for (var a = 0; a < this.requireFail.length; ) {
                if (!(this.requireFail[a].state & (kc | ec)))  {
                    return !1;
                }
                
                a++;
            }
            return !0;
        },
        recognize: function(a) {
            var b = h({}, a);
            return l(this.options.enable, [
                this,
                b
            ]) ? (this.state & (ic | jc | kc) && (this.state = ec) , this.state = this.process(b) , void (this.state & (fc | gc | hc | jc) && this.tryEmit(b))) : (this.reset() , void (this.state = kc));
        },
        process: function() {},
        getTouchAction: function() {},
        reset: function() {}
    } , j(Z, V, {
        defaults: {
            pointers: 1
        },
        attrTest: function(a) {
            var b = this.options.pointers;
            return 0 === b || a.pointers.length === b;
        },
        process: function(a) {
            var b = this.state,
                c = a.eventType,
                d = b & (fc | gc),
                e = this.attrTest(a);
            return d && (c & Bb || !e) ? b | jc : d || e ? c & Ab ? b | hc : b & fc ? b | gc : fc : kc;
        }
    }) , j($, Z, {
        defaults: {
            event: "pan",
            threshold: 10,
            pointers: 1,
            direction: Jb
        },
        getTouchAction: function() {
            var a = this.options.direction,
                b = [];
            return a & Hb && b.push(dc) , a & Ib && b.push(cc) , b;
        },
        directionTest: function(a) {
            var b = this.options,
                c = !0,
                d = a.distance,
                e = a.direction,
                f = a.deltaX,
                g = a.deltaY;
            return e & b.direction || (b.direction & Hb ? (e = 0 === f ? Cb : 0 > f ? Db : Eb , c = f != this.pX , d = Math.abs(a.deltaX)) : (e = 0 === g ? Cb : 0 > g ? Fb : Gb , c = g != this.pY , d = Math.abs(a.deltaY))) , a.direction = e , c && d > b.threshold && e & b.direction;
        },
        attrTest: function(a) {
            return Z.prototype.attrTest.call(this, a) && (this.state & fc || !(this.state & fc) && this.directionTest(a));
        },
        emit: function(a) {
            this.pX = a.deltaX , this.pY = a.deltaY;
            var b = X(a.direction);
            b && this.manager.emit(this.options.event + b, a) , this._super.emit.call(this, a);
        }
    }) , j(_, Z, {
        defaults: {
            event: "pinch",
            threshold: 0,
            pointers: 2
        },
        getTouchAction: function() {
            return [
                bc
            ];
        },
        attrTest: function(a) {
            return this._super.attrTest.call(this, a) && (Math.abs(a.scale - 1) > this.options.threshold || this.state & fc);
        },
        emit: function(a) {
            if (this._super.emit.call(this, a) , 1 !== a.scale) {
                var b = a.scale < 1 ? "in" : "out";
                this.manager.emit(this.options.event + b, a);
            }
        }
    }) , j(ab, V, {
        defaults: {
            event: "press",
            pointers: 1,
            time: 500,
            threshold: 5
        },
        getTouchAction: function() {
            return [
                _b
            ];
        },
        process: function(a) {
            var b = this.options,
                c = a.pointers.length === b.pointers,
                d = a.distance < b.threshold,
                f = a.deltaTime > b.time;
            if (this._input = a , !d || !c || a.eventType & (Ab | Bb) && !f)  {
                this.reset();
            }
            else if (a.eventType & yb)  {
                this.reset() , this._timer = e(function() {
                    this.state = ic , this.tryEmit();
                }, b.time, this);
            }
            else if (a.eventType & Ab)  {
                return ic;
            }
            
            return kc;
        },
        reset: function() {
            clearTimeout(this._timer);
        },
        emit: function(a) {
            this.state === ic && (a && a.eventType & Ab ? this.manager.emit(this.options.event + "up", a) : (this._input.timeStamp = nb() , this.manager.emit(this.options.event, this._input)));
        }
    }) , j(bb, Z, {
        defaults: {
            event: "rotate",
            threshold: 0,
            pointers: 2
        },
        getTouchAction: function() {
            return [
                bc
            ];
        },
        attrTest: function(a) {
            return this._super.attrTest.call(this, a) && (Math.abs(a.rotation) > this.options.threshold || this.state & fc);
        }
    }) , j(cb, Z, {
        defaults: {
            event: "swipe",
            threshold: 10,
            velocity: 0.65,
            direction: Hb | Ib,
            pointers: 1
        },
        getTouchAction: function() {
            return $.prototype.getTouchAction.call(this);
        },
        attrTest: function(a) {
            var b,
                c = this.options.direction;
            return c & (Hb | Ib) ? b = a.velocity : c & Hb ? b = a.velocityX : c & Ib && (b = a.velocityY) , this._super.attrTest.call(this, a) && c & a.direction && a.distance > this.options.threshold && mb(b) > this.options.velocity && a.eventType & Ab;
        },
        emit: function(a) {
            var b = X(a.direction);
            b && this.manager.emit(this.options.event + b, a) , this.manager.emit(this.options.event, a);
        }
    }) , j(db, V, {
        defaults: {
            event: "tap",
            pointers: 1,
            taps: 1,
            interval: 300,
            time: 250,
            threshold: 2,
            posThreshold: 10
        },
        getTouchAction: function() {
            return [
                ac
            ];
        },
        process: function(a) {
            var b = this.options,
                c = a.pointers.length === b.pointers,
                d = a.distance < b.threshold,
                f = a.deltaTime < b.time;
            if (this.reset() , a.eventType & yb && 0 === this.count)  {
                return this.failTimeout();
            }
            
            if (d && f && c) {
                if (a.eventType != Ab)  {
                    return this.failTimeout();
                }
                
                var g = this.pTime ? a.timeStamp - this.pTime < b.interval : !0,
                    h = !this.pCenter || I(this.pCenter, a.center) < b.posThreshold;
                this.pTime = a.timeStamp , this.pCenter = a.center , h && g ? this.count += 1 : this.count = 1 , this._input = a;
                var i = this.count % b.taps;
                if (0 === i)  {
                    return this.hasRequireFailures() ? (this._timer = e(function() {
                        this.state = ic , this.tryEmit();
                    }, b.interval, this) , fc) : ic;
                }
                
            }
            return kc;
        },
        failTimeout: function() {
            return this._timer = e(function() {
                this.state = kc;
            }, this.options.interval, this) , kc;
        },
        reset: function() {
            clearTimeout(this._timer);
        },
        emit: function() {
            this.state == ic && (this._input.tapCount = this.count , this.manager.emit(this.options.event, this._input));
        }
    }) , eb.VERSION = "2.0.4" , eb.defaults = {
        domEvents: !1,
        touchAction: $b,
        enable: !0,
        inputTarget: null,
        inputClass: null,
        preset: [
            [
                bb,
                {
                    enable: !1
                }
            ],
            [
                _,
                {
                    enable: !1
                },
                [
                    "rotate"
                ]
            ],
            [
                cb,
                {
                    direction: Hb
                }
            ],
            [
                $,
                {
                    direction: Hb
                },
                [
                    "swipe"
                ]
            ],
            [
                db
            ],
            [
                db,
                {
                    event: "doubletap",
                    taps: 2
                },
                [
                    "tap"
                ]
            ],
            [
                ab
            ]
        ],
        cssProps: {
            userSelect: "none",
            touchSelect: "none",
            touchCallout: "none",
            contentZooming: "none",
            userDrag: "none",
            tapHighlightColor: "rgba(0,0,0,0)"
        }
    };
    var lc = 1,
        mc = 2;
    fb.prototype = {
        set: function(a) {
            return h(this.options, a) , a.touchAction && this.touchAction.update() , a.inputTarget && (this.input.destroy() , this.input.target = a.inputTarget , this.input.init()) , this;
        },
        stop: function(a) {
            this.session.stopped = a ? mc : lc;
        },
        recognize: function(a) {
            var b = this.session;
            if (!b.stopped) {
                this.touchAction.preventDefaults(a);
                var c,
                    d = this.recognizers,
                    e = b.curRecognizer;
                (!e || e && e.state & ic) && (e = b.curRecognizer = null);
                for (var f = 0; f < d.length; ) c = d[f] , b.stopped === mc || e && c != e && !c.canRecognizeWith(e) ? c.reset() : c.recognize(a) , !e && c.state & (fc | gc | hc) && (e = b.curRecognizer = c) , f++;
            }
        },
        get: function(a) {
            if (a instanceof V)  {
                return a;
            }
            
            for (var b = this.recognizers,
                c = 0; c < b.length; c++) if (b[c].options.event == a)  {
                return b[c];
            }
            ;
            return null;
        },
        add: function(a) {
            if (f(a, "add", this))  {
                return this;
            }
            
            var b = this.get(a.options.event);
            return b && this.remove(b) , this.recognizers.push(a) , a.manager = this , this.touchAction.update() , a;
        },
        remove: function(a) {
            if (f(a, "remove", this))  {
                return this;
            }
            
            var b = this.recognizers;
            return a = this.get(a) , b.splice(s(b, a), 1) , this.touchAction.update() , this;
        },
        on: function(a, b) {
            var c = this.handlers;
            return g(r(a), function(a) {
                c[a] = c[a] || [] , c[a].push(b);
            }) , this;
        },
        off: function(a, b) {
            var c = this.handlers;
            return g(r(a), function(a) {
                b ? c[a].splice(s(c[a], b), 1) : delete c[a];
            }) , this;
        },
        emit: function(a, b) {
            this.options.domEvents && hb(a, b);
            var c = this.handlers[a] && this.handlers[a].slice();
            if (c && c.length) {
                b.type = a , b.preventDefault = function() {
                    b.srcEvent.preventDefault();
                };
                for (var d = 0; d < c.length; ) c[d](b) , d++;
            }
        },
        destroy: function() {
            this.element && gb(this, !1) , this.handlers = {} , this.session = {} , this.input.destroy() , this.element = null;
        }
    } , h(eb, {
        INPUT_START: yb,
        INPUT_MOVE: zb,
        INPUT_END: Ab,
        INPUT_CANCEL: Bb,
        STATE_POSSIBLE: ec,
        STATE_BEGAN: fc,
        STATE_CHANGED: gc,
        STATE_ENDED: hc,
        STATE_RECOGNIZED: ic,
        STATE_CANCELLED: jc,
        STATE_FAILED: kc,
        DIRECTION_NONE: Cb,
        DIRECTION_LEFT: Db,
        DIRECTION_RIGHT: Eb,
        DIRECTION_UP: Fb,
        DIRECTION_DOWN: Gb,
        DIRECTION_HORIZONTAL: Hb,
        DIRECTION_VERTICAL: Ib,
        DIRECTION_ALL: Jb,
        Manager: fb,
        Input: y,
        TouchAction: T,
        TouchInput: Q,
        MouseInput: M,
        PointerEventInput: N,
        TouchMouseInput: S,
        SingleTouchInput: O,
        Recognizer: V,
        AttrRecognizer: Z,
        Tap: db,
        Pan: $,
        Swipe: cb,
        Pinch: _,
        Rotate: bb,
        Press: ab,
        on: n,
        off: o,
        each: g,
        merge: i,
        extend: h,
        inherit: j,
        bindFn: k,
        prefixed: v
    }) , typeof define == kb && define.amd ? define(function() {
        return eb;
    }) : "undefined" != typeof module && module.exports ? module.exports = eb : a[c] = eb;
}(window, document, "Hammer");
//# sourceMappingURL=hammer.min.map

Date.dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];
Date.monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];
Date.monthNumbers = {
    'Jan': 0,
    'Feb': 1,
    'Mar': 2,
    'Apr': 3,
    'May': 4,
    'Jun': 5,
    'Jul': 6,
    'Aug': 7,
    'Sep': 8,
    'Oct': 9,
    'Nov': 10,
    'Dec': 11
};
Date.getShortMonthName = function(month) {
    return Date.monthNames[month].substring(0, 3);
};
Date.getShortDayName = function(day) {
    return Date.dayNames[day].substring(0, 3);
};
Date.getMonthNumber = function(name) {
    return Date.monthNumbers[name.substring(0, 1).toUpperCase() + name.substring(1, 3).toLowerCase()];
};
Date.parseCodes.S.s = '(?:st|nd|rd|th)';
if (Ext.picker.Picker) {
    Ext.override(Ext.picker.Picker, {
        doneText: 'Done'
    });
}
if (Ext.picker.Date) {
    Ext.override(Ext.picker.Date, {
        'dayText': 'Day',
        'monthText': 'Month',
        'yearText': 'Year',
        'slotOrder': [
            'month',
            'day',
            'year'
        ]
    });
}
if (Ext.IndexBar) {
    Ext.override(Ext.IndexBar, {
        'letters': [
            'A',
            'B',
            'C',
            'D',
            'E',
            'F',
            'G',
            'H',
            'I',
            'J',
            'K',
            'L',
            'M',
            'N',
            'O',
            'P',
            'Q',
            'R',
            'S',
            'T',
            'U',
            'V',
            'W',
            'X',
            'Y',
            'Z'
        ]
    });
}
if (Ext.NestedList) {
    Ext.override(Ext.NestedList, {
        'backText': 'Back',
        'loadingText': 'Loading...',
        'emptyText': 'No items available.'
    });
}
if (Ext.util.Format) {
    Ext.util.Format.defaultDateFormat = 'm/d/Y';
}
if (Ext.MessageBox) {
    Ext.MessageBox.OK.text = 'OK';
    Ext.MessageBox.CANCEL.text = 'Cancel';
    Ext.MessageBox.YES.text = 'Yes';
    Ext.MessageBox.NO.text = 'No';
}

Ext.data.SyncProxy = Ext.extend(Ext.data.Proxy, {
    definition: undefined,
    csv: undefined,
    generator: undefined,
    model: undefined,
    store: undefined,
    idProperty: undefined,
    idDefaultProperty: undefined,
    // JCM constructor should not be async, delay until first operation
    constructor: function(config, callback, scope) {
        //
        Ext.data.utilities.check('SyncProxy', 'constructor', 'config', config, [
            'store',
            'database_name',
            'key'
        ]);
        //
        Ext.data.SyncProxy.superclass.constructor.call(this, config);
        this.store = config.store;
        //
        // System Name
        //
        this.store.readValue('Sencha.Sync.system_name', function(system_name) {
            config.system_name = system_name || Ext.data.UUIDGenerator.generate();
            this.store.writeValue('Sencha.Sync.system_name', config.system_name, function() {
                //
                // Load Configuration
                //
                Ext.data.utilities.apply(this, [
                    'readConfig_DatabaseDefinition',
                    'readConfig_CSV',
                    'readConfig_Generator'
                ], [
                    config
                ], function() {
                    if (this.definition.system_name === undefined) {
                        this.definition.set({
                            system_name: Ext.data.UUIDGenerator.generate()
                        });
                    }
                    console.log("SyncProxy - Opened database '" + config.key + "/" + config.database_name + "/" + config.datastore_name + "'");
                    if (callback) {
                        callback.call(scope, this);
                    }
                }, this);
            }, this);
        }, this);
    },
    create: function(operation, callback, scope) {
        operation.records.forEach(function(record) {
            record.setCreateState(this.makeGenerator());
            // if there's no user id, then use the oid.
            if (record.get(this.idProperty) === this.idPropertyDefaultValue) {
                var p = record.getPair(Ext.data.SyncModel.OID);
                record.data[this.idProperty] = p.v;
            }
        }, // JCM check that the id is unique
        this);
        var records = this.encodeRecords(operation.records);
        return this.store.create(records, function() {
            this.indexCreatedRecords(records, function() {
                //console.log('create',operation);
                this.doCallback(callback, scope, operation);
            }, this);
        }, this);
    },
    read: function(operation, callback, scope) {
        function makeResultSet(operation, records, no_system_records) {
            records = this.decodeRecords(records);
            records = Ext.data.array.select(records, function(record) {
                return record.isNotDestroyed() && !record.phantom && (!no_system_records || !record.isSystemModel());
            }, this);
            operation.resultSet = new Ext.data.ResultSet({
                records: records,
                total: records.length,
                loaded: true
            });
        }
        
        if (operation.id !== undefined) {
            this.store.indexLookup(operation.id, function(oid) {
                // JCM if the id is not in the index, then it doesn't exist, so we can return now...
                this.store.read(oid, function(record) {
                    makeResultSet.call(this, operation, [
                        record
                    ], true);
                    this.doCallback(callback, scope, operation);
                }, this);
            }, this);
        } else if (operation[Ext.data.SyncModel.OID] !== undefined) {
            this.store.read(operation[Ext.data.SyncModel.OID], function(record) {
                makeResultSet.call(this, operation, [
                    record
                ], false);
                this.doCallback(callback, scope, operation);
            }, this);
        } else {
            var records = [];
            this.store.forEachRecordAsync(function(record, next_callback, next_scope) {
                //console.log(Ext.encode(record))
                records.push(record);
                next_callback.call(next_scope);
            }, this, function() {
                makeResultSet.call(this, operation, records, true);
                this.doCallback(callback, scope, operation);
            }, this);
        }
    },
    update: function(operation, callback, scope) {
        operation.records.forEach(function(record) {
            record.setUpdateState(this.makeGenerator());
        }, this);
        // JCM make sure that the id has not been changed.
        var records = this.encodeRecords(operation.records);
        return this.store.update(records, function(operation) {
            this.doCallback(callback, scope, operation);
        }, this);
    },
    destroy: function(operation, callback, scope) {
        var records = [];
        Ext.data.array.forEachAsync(operation.records, function(record, next_callback, next_scope) {
            record.setDestroyState(this.makeGenerator());
            var oid = record.oid();
            if (!oid) {
                var id = record.data[this.idProperty];
                this.store.indexLookup(id, function(oid) {
                    // JCM if the id is not in the index, then it doesn't exist, so we don't need to try deleting it.
                    if (oid) {
                        record.data[Ext.data.SyncModel.OID] = oid;
                        records.push(record);
                    }
                    next_callback.call(next_scope);
                }, this);
            } else {
                records.push(record);
                next_callback.call(next_scope);
            }
        }, this, function() {
            records = this.encodeRecords(records);
            this.store.update(records, function(operation) {
                operation.action = 'destroy';
                this.indexDestroyedRecords(records, function() {
                    this.doCallback(callback, scope, operation);
                }, this);
            }, this);
        }, this);
    },
    clear: function(callback, scope) {
        this.store.clear(callback, scope);
    },
    setModel: function(model, setOnStore) {
        this.model = model;
        this.idProperty = this.model.prototype.idProperty;
        var fields = this.model.prototype.fields.items,
            length = fields.length,
            field, i;
        for (i = 0; i < length; i++) {
            field = fields[i];
            if (field.name === this.idProperty) {
                this.idPropertyDefaultValue = field.defaultValue;
            }
        }
        this.definition.set({
            idProperty: this.idProperty,
            idPropertyDefaultValue: this.idPropertyDefaultValue
        }, function() {}, this);
        // extend the user's model with the replication state data,
        Ext.apply(model.prototype, Ext.data.SyncModel);
        // and create a local storage model, based on the user's model.
        this.storageModel = model.prototype.createReplStorageModel(this.modelName);
        // JCM shouldn't need to pass the name in
        this.store.setModel(this.storageModel, setOnStore);
    },
    replicaNumber: function() {
        return this.generator.r;
    },
    addReplicaNumbers: function(csv, callback, scope) {
        this.csv.addReplicaNumbers(csv, callback, scope);
    },
    setReplicaNumber: function(new_replica_number, callback, scope) {
        if (!callback) {
            throw "ERROR - SyncProxy - setReplicaNumber - no callback provided.";
        }
        var old_replica_number = this.replicaNumber();
        console.log('SyncProxy.setReplicaNumber from', old_replica_number, 'to', new_replica_number);
        this.changeReplicaNumber(old_replica_number, new_replica_number, function() {
            this.definition.setReplicaNumber(new_replica_number, function() {
                this.csv.changeReplicaNumber(old_replica_number, new_replica_number, function() {
                    this.generator.setReplicaNumber(new_replica_number, callback, scope);
                }, this);
            }, this);
        }, this);
    },
    changeReplicaNumber: function(old_replica_number, new_replica_number, callback, scope) {
        console.log('SyncProxy.changeReplicaNumber from', old_replica_number, 'to', new_replica_number);
        if (!callback) {
            throw "ERROR - SyncProxy - changeReplicaNumber - no callback provided.";
        }
        this.forEachRecordAsync(function(record, next_callback, next_scope) {
            if (!record.isSystemModel()) {
                var old_oid = record.oid();
                if (record.changeReplicaNumber(old_replica_number, new_replica_number)) {
                    var records = this.encodeRecords([
                            record
                        ]);
                    this.store.create(records, function() {
                        this.indexCreatedRecords(records, function() {
                            this.store.destroy(old_oid, next_callback, next_scope);
                        }, this);
                    }, this);
                } else {
                    next_callback.call(next_scope);
                }
            } else {
                next_callback.call(next_scope);
            }
        }, this, callback, scope);
    },
    getUpdates: function(csv, callback, scope) {
        this.csv.addReplicaNumbers(csv, function() {
            csv.addReplicaNumbers(this.csv, function() {
                // JCM full scan - expensive - maintain a cs index?
                // JCM might also be too big... perhaps there should be a limit on the number
                // JCM of updates that can be collected...
                // JCM could also exhaust the stack
                // JCM could have a fixed sized list, discarding newest to add older
                // JCM could have a full update protocol as well as an incremental protocol
                var updates = [];
                this.forEachRecordAsync(function(record, next_callback, next_scope) {
                    updates = updates.concat(record.getUpdates(csv));
                    next_callback.call(next_scope);
                }, this, function() {
                    callback.call(scope, new Ext.data.Updates(updates));
                }, this);
            }, this);
        }, this);
    },
    putUpdates: function(updates, callback, scope) {
        //
        // JCM could batch updates by object, to save on wasteful repeated gets and sets of the same object
        //
        // A client or server could receive a large number of updates, which
        // because of the recursive nature of the following code, could
        // exhaust the stack. (Most browsers have a limit of 1000 frames.)
        // Also, on the client, hogging the cpu can cause the UI to feel
        // unresponsive to the user. So, we chunk the updates and process
        // each in turn, yielding the cpu between them.
        //
        var chunks = updates.chunks(10);
        Ext.data.array.forEachYielding(chunks, function(chunk, next_callback, next_scope) {
            Ext.data.array.forEachAsync(chunk.updates, function(update, next_callback2, next_scope2) {
                this.applyUpdate(update, function() {
                    // make sure to bump forward our clock, just in case one of our peers has run ahead
                    this.generator.seen(update.c);
                    // update the local csv, after the update has been processed.
                    this.csv.add(update.c, next_callback2, next_scope2);
                }, this);
            }, this, next_callback, next_scope);
        }, this, callback, scope);
    },
    applyUpdate: function(update, callback, scope, last_ref) {
        // Attribute Value - Conflict Detection and Resolution
        if (last_ref) {
            console.log('ref ==> ', this.us(update));
        } else {
            console.log('applyUpdate', this.us(update));
        }
        this.store.read(update.i, function(record) {
            if (record) {
                var ref = record.ref();
                if (ref && update.p[0] != '_') {
                    // JCM this is a bit sneaky
                    if (update.i === ref) {
                        console.log("Error - applyUpdate - Infinite loop following reference. ", ref);
                        callback.call(scope);
                    } else {
                        update.i = ref;
                        this.applyUpdate(update, callback, scope, ref);
                    }
                } else {
                    if (update.p === this.idProperty) {
                        this.applyUpdateToRecordForUniqueID(record, update, callback, scope);
                    } else {
                        this.applyUpdateToRecord(record, update, callback, scope);
                    }
                }
            } else {
                this.applyUpdateCreatingNewRecord(update, callback, scope);
            }
        }, this);
    },
    applyUpdateCreatingNewRecord: function(update, callback, scope) {
        // no record with that oid is in the local store...
        if (update.p === Ext.data.SyncModel.OID) {
            // ...which is ok, because the update is intending to create it
            var record = this.createNewRecord(update.v, update.c);
            //console.log('applyUpdate',Ext.encode(record.data),'( create )');
            this.store.create([
                record
            ], callback, scope);
        } else {
            // ...which is not ok, because given the strict ordering of updates
            // by change stamp the update creating the object must be sent first.
            // But, let's be forgiving and create the record to receive the update.
            console.log("Warning - Update received for unknown record " + update.i, update);
            var record = this.createNewRecord(update.i, update.i);
            record.setPair(update.p, update.v, update.c);
            this.store.create([
                record
            ], callback, scope);
        }
    },
    applyUpdateToRecordForUniqueID: function(record, update, callback, scope) {
        // update is to the id, for which we maintain uniqueness
        if (record.data[update.p] === update.v) {
            // re-asserting same value for the id
            this.applyUpdateToRecordForUniqueId(record, update, callback, scope);
        } else {
            // different value for the id, so check if a record already exists with that value
            this.store.indexLookup(update.v, function(existing_record_oid) {
                //console.log(this.us(update),'id already exists')
                if (existing_record_oid) {
                    //console.log('existing_record_oid',existing_record_oid)
                    this.readById(update.v, existing_record_oid, function(existing_record) {
                        //console.log('existing_record',Ext.encode(existing_record.data))
                        // JCM if the process were to fail part way through these updates...
                        // JCM would the system be hoarked?
                        this.applyUpdateToRecordForUniqueId(record, update, function() {
                            var r_cs = new Ext.data.CS(record.oid());
                            var er_cs = new Ext.data.CS(existing_record.oid());
                            var r_before, r_after;
                            if (r_cs.greaterThan(er_cs)) {
                                // the record being updated is more recent then the existing record
                                //console.log(this.us(update),'existing record is older');
                                r_before = existing_record;
                                r_after = record;
                            } else {
                                // the existing record is more recent than the record being updated
                                //console.log(this.us(update),'existing record is newer');
                                r_before = record;
                                r_after = existing_record;
                            }
                            this.resolveUniqueIDConflict(r_before, r_after, function() {
                                this.store.indexUpdate(update.v, r_before.oid(), callback, scope);
                            }, this);
                        }, this);
                    }, this);
                } else {
                    // the new id value did not exist at the time of the update
                    this.applyUpdateToRecordForUniqueId(record, update, callback, scope);
                }
            }, this);
        }
    },
    applyUpdatesToRecord: function(record, updates, callback, scope) {
        if (updates.length > 0) {
            Ext.data.array.forEachAsync(updates, function(update, next_callback, next_scope) {
                this.applyUpdateToRecord(record, update, next_callback, next_scope);
            }, this, callback, scope);
        } else {
            callback.call(scope);
        }
    },
    applyUpdateToRecordForUniqueId: function(record, update, callback, scope) {
        var value_before = record.data[update.p];
        var value_after = update.v;
        this.applyUpdateToRecord(record, update, function(changed) {
            if (changed) {
                this.store.indexUpdate(value_after, record.oid(), function() {
                    if (value_before) {
                        this.store.indexUpdate(value_before, undefined, function() {
                            callback.call(scope, changed);
                        }, this);
                    } else {
                        callback.call(scope, changed);
                    }
                }, this);
            } else {
                callback.call(scope, changed);
            }
        }, this);
    },
    applyUpdateToRecord: function(record, update, callback, scope) {
        if (record.putUpdate(update)) {
            //console.log(this.us(update),'accepted')
            this.store.update([
                record
            ], function() {
                callback.call(scope, true);
            }, scope);
        } else {
            //console.log(this.us(update),'rejected')
            callback.call(scope, false);
        }
    },
    readById: function(id, oid, callback, scope) {
        // JCM move into applyUpdateToUniqueID?
        this.store.read(oid, function(record) {
            if (record) {
                callback.call(scope, record);
            } else {
                console.log('ERROR - SyncProxy - applyUpdateToUniqueID - ID Index refers to an non-existant object:', id, '=>', oid, '(This should not be possible.)');
            }
        }, this);
    },
    resolveUniqueIDConflict: function(r1, r2, callback, scope) {
        // JCM move into applyUpdateToUniqueID?
        var updates = this.updatesForMergeRecords(r1, r2);
        this.applyUpdatesToRecord(r1, updates, function() {
            var updates = this.updatesForMakeReference(r2, r1);
            this.applyUpdatesToRecord(r2, updates, function() {
                callback.call(scope);
            }, this);
        }, this);
    },
    updatesForMergeRecords: function(r1, r2) {
        // merge r2 into r1 // JCM move into applyUpdateToUniqueID?
        // r1 receives all updates from r2
        var csv = r1.getCSV();
        var updates1 = r2.getUpdates(csv);
        var updates2 = [];
        var r1_oid = r1.oid();
        updates1.forEach(function(update) {
            if (update.p !== this.idProperty && update.p !== Ext.data.SyncModel.OID) {
                update.i = r1_oid;
                updates2.push(update);
            }
        }, this);
        //console.log('updatesForMergeRecords - csv',csv);
        //console.log('updatesForMergeRecords - r1',r1.data);
        //console.log('updatesForMergeRecords - r2',r2.data);
        //console.log('updatesForMergeRecords - updates',updates2);
        return updates2;
    },
    updatesForMakeReference: function(r1, r2) {
        // JCM move into applyUpdateToUniqueID?
        if (r1.oid() === r2.oid()) {
            console.log('updatesForMakeReference', r1.data, r2.data);
            throw "Error - SyncProxy - Tried to create reference to self.";
        }
        var cs1 = this.generateChangeStamp();
        var cs2 = this.generateChangeStamp();
        var updates = [
                {
                    i: r1.oid(),
                    p: Ext.data.SyncModel.REF,
                    v: r2.oid(),
                    c: cs1
                },
                {
                    i: r1.oid(),
                    p: Ext.data.SyncModel.TOMBSTONE,
                    v: cs2.to_s(),
                    c: cs2
                }
            ];
        //console.log('updatesForMakeReference',updates);
        return updates;
    },
    createNewRecord: function(oid, cs) {
        var record = new this.storageModel();
        record.phantom = false;
        Ext.apply(record, Ext.data.SyncModel);
        record.setPair(Ext.data.SyncModel.OID, oid, cs);
        return record;
    },
    indexCreatedRecords: function(records, callback, scope) {
        //console.log('indexCreatedRecords');
        Ext.data.array.forEachAsync(records, function(record, next_callback, next_scope) {
            var record_id = record.data[this.idProperty];
            if (record_id) {
                this.store.indexUpdate(record_id, record.data[Ext.data.SyncModel.OID], next_callback, next_scope);
            } else {
                next_callback.call(next_scope);
            }
        }, this, callback, scope);
    },
    indexDestroyedRecords: function(records, callback, scope) {
        //console.log('indexDestroyedRecords');
        Ext.data.array.forEachAsync(records, function(record, next_callback, next_scope) {
            var record_id = record.data[this.idProperty];
            if (record_id) {
                this.store.indexUpdate(record_id, undefined, next_callback, next_scope);
            } else {
                next_callback.call(next_scope);
            }
        }, this, callback, scope);
    },
    makeGenerator: function() {
        var me = this;
        return function() {
            return me.generateChangeStamp();
        };
    },
    generateChangeStamp: function() {
        var cs = this.generator.get();
        this.csv.add(cs);
        return cs;
    },
    equals: function(x, callback, scope) {
        // for testing
        if (this.csv.equals(x.csv)) {
            this.hasSameRecords(x, function(r) {
                if (r) {
                    x.hasSameRecords(this, callback, scope);
                } else {
                    callback.call(scope, false);
                }
            }, this);
        } else {
            callback.call(scope, false);
        }
    },
    hasSameRecords: function(x, callback, scope) {
        // for testing
        this.forEachRecordAsync(function(r1, next_callback, next_scope) {
            this.store.read(r1.oid(), function(r2) {
                if (r2) {
                    var r = r1.equals(r2);
                    if (r) {
                        next_callback.call(next_scope);
                    } else {
                        console.log('hasSameRecords - false - ', this.replicaNumber(), x.replicaNumber());
                        callback.call(scope, false);
                    }
                } else {
                    console.log('hasSameRecords - false - ', this.replicaNumber(), x.replicaNumber());
                    callback.call(scope, false);
                }
            }, this);
        }, this, function() {
            callback.call(scope, true);
        }, this);
    },
    console_log: function(text, callback, scope) {
        // for testing
        console.log('---- ', text);
        this.forEachRecordAsync(function(r1, next_callback, next_scope) {
            console.log(Ext.encode(r1.data));
            next_callback.call(next_scope);
        }, this, function() {
            console.log('----');
            callback.call(scope);
        }, this);
    },
    forEachRecordAsync: function(each_callback, each_scope, done_callback, done_scope) {
        // JCM this is expensive... nothing should really call this.....
        var Model = this.model;
        this.store.forEachRecordAsync(function(record, next_callback, next_scope) {
            each_callback.call(each_scope, new Model(record.data), next_callback, next_scope);
        }, this, done_callback, done_scope);
    },
    encodeRecords: function(records) {
        var Model = this.storageModel;
        return Ext.data.array.collect(records, function() {
            var record = new Model(this.data);
            record.internalId = this.internalId;
            record.phantom = false;
            return record;
        });
    },
    decodeRecords: function(records) {
        var Model = this.model;
        return Ext.data.array.collect(records, function() {
            var record = new Model(this.data);
            record.internalId = this.internalId;
            record.phantom = false;
            return record;
        });
    },
    readConfig_DatabaseDefinition: function(config, callback, scope) {
        var default_data = {
                key: config.key,
                system_name: config.system_name,
                generation: 0,
                replica_number: 0
            };
        var overwrite_data = {
                database_name: config.database_name,
                replica_type: config.replica_type
            };
        this.readConfig(Ext.data.DatabaseDefinition, 'definition', default_data, overwrite_data, function(definition) {
            this.definition = definition;
            callback.call(scope);
        }, this);
    },
    readConfig_Generator: function(config, callback, scope) {
        var overwrite_data = {
                r: this.definition.replica_number,
                clock: config.clock
            };
        this.readConfig(Ext.data.CSGenerator, 'generator', {}, overwrite_data, function(generator) {
            this.generator = generator;
            callback.call(scope);
        }, this);
    },
    readConfig_CSV: function(config, callback, scope) {
        this.readConfig(Ext.data.CSV, 'csv', {}, {}, function(csv) {
            this.csv = csv;
            callback.call(scope);
        }, this);
    },
    writeConfig: function(id, object, callback, scope) {
        this.store.writeConfig(id, object.as_data(), function(data) {
            object.set(data);
            callback.call(scope);
        }, this);
    },
    readConfig: function(Klass, id, default_data, overwrite_data, callback, scope) {
        var changed, name;
        this.store.readConfig(id, function(data) {
            if (default_data !== undefined) {
                if (data === undefined) {
                    data = default_data;
                } else {
                    for (name in default_data) {
                        if (data[name] === undefined) {
                            data[name] = default_data[name];
                            changed = true;
                        }
                    }
                }
            }
            if (overwrite_data !== undefined) {
                if (data === undefined) {
                    data = overwrite_data;
                } else {
                    for (name in overwrite_data) {
                        if (data[name] !== overwrite_data[name]) {
                            data[name] = overwrite_data[name];
                            changed = true;
                        }
                    }
                }
            }
            var me = this;
            data.config_id = id;
            data.write_fn = function(object, write_callback, write_scope) {
                me.writeConfig.call(me, id, object, write_callback, write_scope);
            };
            callback.call(scope, new Klass(data));
        }, this);
    },
    doCallback: function(callback, scope, operation) {
        if (typeof callback == 'function') {
            callback.call(scope || this, operation);
        }
    },
    us: function(u) {
        var p = Ext.isArray(u.p) ? u.p.join() : u.p;
        var v = u.v;
        switch (typeof u.v) {
            case 'object':
                v = Ext.encode(u.v);
        }
        return '(' + u.i + ' . ' + p + ' = \'' + v + '\' @ ' + u.c.to_s() + ')';
    }
});

Ext.regModel("Sencha.Protocol.Model", {
    // JCM not actually used...
    fields: [
        {
            name: "id"
        }
    ]
});
Ext.data.SyncStorageProxy = Ext.extend(Ext.data.Proxy, {
    constructor: function(config) {
        //
        Ext.data.utilities.check('SyncStorageProxy', 'constructor', 'config', config, [
            'id',
            'url',
            'key'
        ]);
        //
        Ext.data.SyncStorageProxy.superclass.constructor.call(this, config);
        //
        // Local Storage Proxy
        //
        config.database_name = config.id;
        config.datastore_name = 'data';
        config.localStorageProxy = config.localStorageProxy || Ext.data.ProxyMgr.create({
            type: 'localstorage',
            id: config.database_name
        });
        config.store = config.store || new Ext.data.SyncStore(config);
        //
        // Remote Storage Proxy
        //
        config.remoteStorageProxy = config.remoteStorageProxy || Ext.data.ProxyMgr.create({
            type: 'scripttag',
            url: config.url,
            model: 'Sencha.Protocol.Model'
        });
        // JCM This is just to keep the underlying code quiet. Could use an anonymous model? 
        //
        // Sync Storage Proxy (combines local and remote proxies)
        //
        this.proxy = new Ext.data.SyncProxy(config);
        Ext.data.utilities.delegate(this, this.proxy, [
            'create',
            'read',
            'update',
            'destroy',
            'setModel'
        ]);
        //
        // Sync Protocol
        //
        this.protocol = new Ext.data.Protocol(config);
    },
    sync: function(callback, scope) {
        this.protocol.sync(this.proxy, callback, scope);
    }
});
Ext.data.ProxyMgr.registerType('syncstorage', Ext.data.SyncStorageProxy);

Ext.data.SyncStore = Ext.extend(Object, {
    constructor: function(config) {
        Ext.data.utilities.check('SyncStore', 'constructor', 'config', config, [
            'database_name',
            'localStorageProxy'
        ]);
        this.local = config.localStorageProxy;
        this.readConfig('index', function(data) {
            this.index = data || {};
        }, this);
    },
    create: function(records, callback, scope) {
        //console.log('SyncStore - create -',records[0].getId(),Ext.encode(records[0].data))
        var operation = new Ext.data.Operation({
                records: records
            });
        this.local.create(operation, callback, scope);
    },
    read: function(oid, callback, scope) {
        //console.log('SyncStore - read -',oid)
        var operation = new Ext.data.Operation({
                action: 'read',
                id: oid
            });
        this.local.read(operation, function(operation2) {
            var record;
            if (operation2.resultSet.count == 1) {
                record = operation2.resultSet.records[0];
                Ext.apply(record, Ext.data.SyncModel);
            } else //console.log('SyncStore - read -',oid,'=>',Ext.encode(record.data));
            {}
            //console.log('SyncStore - read -',oid,'=> not_found')
            callback.call(scope, record);
        }, this);
    },
    update: function(records, callback, scope) {
        //console.log('SyncStore - update',Ext.encode(records))
        var operation = new Ext.data.Operation({
                action: 'update',
                records: records
            });
        this.local.update(operation, callback, scope);
    },
    destroy: function(oid, callback, scope) {
        //console.log('SyncStore - destroy -',oid)
        var data = {};
        data[Ext.data.SyncModel.OID] = oid;
        var records = [
                new this.local.model(data)
            ];
        var operation = new Ext.data.Operation({
                action: 'destroy',
                records: records
            });
        this.local.destroy(operation, callback, scope);
    },
    clear: function(callback, scope) {
        this.local.clear();
        callback.call(scope);
    },
    setModel: function(model, setOnStore) {
        //console.log('SyncStore - setModel',model)
        this.model = model;
        this.local.setModel(model, setOnStore);
    },
    readConfig: function(oid, callback, scope) {
        var item = this.local.getStorageObject().getItem(this.local.id + "-" + oid);
        var data = item ? Ext.decode(item) : {};
        callback.call(scope, data);
    },
    writeConfig: function(oid, data, callback, scope) {
        this.local.getStorageObject().setItem(this.local.id + "-" + oid, Ext.encode(data));
        callback.call(scope, data);
    },
    indexUpdate: function(id, oid, callback, scope) {
        if (!callback) {
            throw "ERROR - SyncStore - indexUpdate - no callback provided";
        }
        console.log('SyncStore - indexUpdate -', id, '=>', oid);
        this.index[id] = oid;
        this.writeConfig('index', this.index, callback, scope);
    },
    indexLookup: function(id, callback, scope) {
        if (!callback) {
            throw "ERROR - SyncStore - indexLookup - no callback provided";
        }
        var oid = this.index[id];
        console.log('SyncStore - indexLookup -', id, '=>', oid);
        callback.call(scope, oid);
    },
    readValue: function(key, callback, scope) {
        var value = this.local.getStorageObject().getItem(key);
        callback.call(scope, value);
    },
    writeValue: function(key, value, callback, scope) {
        this.local.getStorageObject().setItem(key, value);
        callback.call(scope);
    },
    forEachRecordAsync: function(each_callback, each_scope, done_callback, done_scope) {
        // JCM this is expensive... nothing should really call this.....
        //console.log('SyncStore - forEachRecordAsync')
        if (!each_callback) {
            throw "ERROR - SyncStore - forEachRecordAsync - no 'each' callback provided";
        }
        if (!done_callback) {
            throw "ERROR - SyncStore - forEachRecordAsync - no 'done' callback provided";
        }
        var operation = new Ext.data.Operation({
                action: 'read'
            });
        var ids = this.local.getIds();
        Ext.data.array.forEachAsync(ids, function(id, next_callback, next_scope) {
            operation.id = id;
            this.local.read(operation, function(operation) {
                if (operation.resultSet.count == 1) {
                    var record = operation.resultSet.records[0];
                    //console.log('SyncStore - forEachRecordAsync - record',Ext.encode(record))
                    each_callback.call(each_scope, record, next_callback, next_scope);
                } else {
                    throw "ERROR - SyncStore - forEachRecordAsync - no record for id " + id;
                    next_callback.call(next_scope);
                }
            }, this);
        }, this, done_callback, done_scope);
    }
});

Ext.data.array = {
    select: function(a, fn, scope) {
        var r = [];
        if (a) {
            a.forEach(function(i) {
                if (i !== undefined && fn.call(scope || i, i)) {
                    r.push(i);
                }
            });
        }
        return r;
    },
    index: function(a, fn, scope) {
        if (a) {
            var j,
                l = a.length;
            for (var i = 0; i < l; i++) {
                j = a[i];
                if (fn.call(scope || j, j)) {
                    return i;
                }
            }
        }
    },
    collect: function(a, fn, scope) {
        var r = [];
        if (a) {
            a.forEach(function(i) {
                if (i !== undefined) {
                    r.push(fn.call(scope || i, i));
                }
            });
        }
        return r;
    },
    includes: function(a, v) {
        if (a) {
            var l = a.length;
            for (var i = 0; i < l; i++) {
                if (a[i] === v) {
                    return true;
                }
            }
        }
        return false;
    },
    remove: function(a, v) {
        var r = [];
        if (a) {
            var j,
                l = a.length;
            for (var i = 0; i < l; i++) {
                j = a[i];
                if (j !== v) {
                    r.push(j);
                }
            }
        }
        return r;
    },
    any: function(a, fn, scope) {
        var j,
            l = a.length;
        for (var i = 0; i < l; i++) {
            j = a[i];
            if (fn.call(scope || j, j)) {
                return true;
            }
        }
        return false;
    },
    all: function(a, fn, scope) {
        var j,
            l = a.length;
        for (var i = 0; i < l; i++) {
            var j = a[i];
            if (!fn.call(scope || j, j)) {
                return false;
            }
        }
        return true;
    },
    forEachAsync: function(a, each_fn, each_scope, done_fn, done_scope) {
        if (!each_fn) {
            throw "ERROR - Ext.data.Array - forEachAsync - no 'each' function provided";
        }
        if (!done_fn) {
            throw "ERROR - Ext.data.Array - forEachAsync - no 'done' function provided";
        }
        var i = 0;
        var l = a.length;
        var f = function f() {
                if (i < l) {
                    var j = a[i];
                    var scope = each_scope || j;
                    i = i + 1;
                    each_fn.call(scope, j, f, scope);
                } else {
                    done_fn.call(done_scope);
                }
            };
        f();
    },
    forEachYielding: function(a, each_fn, each_scope, done_fn, done_scope) {
        var i = 0;
        var l = a.length;
        function f() {
            if (i < l) {
                each_fn.call(each_scope, a[i], function() {
                    i = i + 1;
                    setTimeout(f, 20);
                }, // ms
                this);
            } else {
                done_fn.call(done_scope);
            }
        }
        
        f();
    }
};

Ext.data.CS = Ext.extend(Object, {
    // Change Stamp
    r: 0,
    // replica_number
    t: 0,
    // time, in seconds since the epoch
    s: 0,
    // sequence number
    constructor: function(config) {
        this.set(config);
    },
    set: function(x) {
        if (typeof x === 'string' || x instanceof String) {
            this.from_s(x);
        } else if (typeof x === 'object') {
            this.r = x.r || 0;
            this.t = x.t || 0;
            this.s = x.s || 0;
        }
    },
    changeReplicaNumber: function(old_replica_number, new_replica_number) {
        if (this.r == old_replica_number) {
            this.r = new_replica_number;
            return true;
        }
        return false;
    },
    greaterThan: function(x) {
        return this.compare(x) > 0;
    },
    lessThan: function(x) {
        return this.compare(x) < 0;
    },
    equals: function(x) {
        return this.compare(x) === 0;
    },
    compare: function(x) {
        var r = this.t - x.t;
        if (r == 0) {
            r = this.s - x.s;
            if (r == 0) {
                r = this.r - x.r;
            }
        }
        return r;
    },
    from_s: function(t) {
        var m = t.match(/(\d+)-(\d+)-?(\d+)?/);
        if (m && m.length > 0) {
            this.r = parseInt(m[1]);
            this.t = parseInt(m[2]);
            this.s = m[3] ? parseInt(m[3]) : 0;
        } else {
            throw "Error - CS - Bad change stamp '" + t + "'.";
        }
        return this;
    },
    to_s: function() {
        return this.r + "-" + this.t + (this.s > 0 ? "-" + this.s : "");
    }
});

Ext.data.CSGenerator = Ext.extend(Ext.data.Config, {
    r: undefined,
    // replica_number
    t: undefined,
    // time, in seconds since epoch
    s: undefined,
    // sequence number
    clock: undefined,
    local_offset: undefined,
    global_offset: undefined,
    constructor: function(config, callback, scope) {
        Ext.apply(this, config);
        config.config_id = 'generator';
        Ext.data.CSGenerator.superclass.constructor.call(this, config);
        this.clock = this.clock || new Ext.data.Clock();
        this.t = this.t || this.clock.now();
        this.s = this.s || -1;
        // so that the next tick gets us to 0
        this.local_offset = this.local_offset || 0;
        this.global_offset = this.global_offset || 0;
        this.writeAndCallback(true, callback, scope);
    },
    get: function(callback, scope) {
        // the next change stamp
        var current_time = this.clock.now();
        this.update_local_offset(current_time);
        this.s += 1;
        if (this.s > 255) {
            // JCM This is totally arbitrary, and it's hard coded too....
            this.t = current_time;
            this.local_offset += 1;
            this.s = 0;
        }
        this.writeAndCallback(true, callback, scope);
        // JCM it seems wrong to use the CS until it has been committed to disk...
        return new Ext.data.CS({
            r: this.r,
            t: this.global_time(),
            s: this.s
        });
    },
    // JCM return in the callback 
    seen: function(cs, callback, scope) {
        // a change stamp we just received
        var changed = false;
        var current_time = this.clock.now();
        if (current_time > this.t) {
            changed = this.update_local_offset(current_time);
        }
        changed = changed || this.update_global_offset(cs);
        this.writeAndCallback(changed, callback, scope);
    },
    setReplicaNumber: function(replica_number, callback, scope) {
        var changed = this.r !== replica_number;
        this.r = replica_number;
        this.writeAndCallback(changed, callback, scope);
    },
    // @private
    update_local_offset: function(current_time) {
        var changed = false;
        var delta = current_time - this.t;
        if (delta > 0) {
            // local clock moved forwards
            var local_time = this.global_time();
            this.t = current_time;
            if (delta > this.local_offset) {
                this.local_offset = 0;
            } else {
                this.local_offset -= delta;
            }
            var local_time_after = this.global_time();
            if (local_time_after > local_time) {
                this.s = -1;
            }
            changed = true;
        } else if (delta < 0) {
            // local clock moved backwards
            // JCM if delta is too big, then complain
            this.t = current_time;
            this.local_offset += -delta;
            changed = true;
        }
        return changed;
    },
    update_global_offset: function(remote_cs) {
        var changed = false;
        var local_cs = new Ext.data.CS({
                r: this.r,
                t: this.global_time(),
                s: this.s + 1
            });
        var local_t = local_cs.t;
        var local_s = local_cs.s;
        var remote_t = remote_cs.t;
        var remote_s = remote_cs.s;
        if (remote_t == local_t && remote_s >= local_s) {
            this.s = remote_s;
            changed = true;
        } else if (remote_t > local_t) {
            var delta = remote_t - local_t;
            if (delta > this.global_offset) {
                // remote clock moved forwards
                // JCM guard against moving too far forward
                this.global_offset += delta;
                this.s = remote_s;
                changed = true;
            }
        }
        return changed;
    },
    global_time: function() {
        return this.t + this.local_offset + this.global_offset;
    },
    as_data: function() {
        var data = {
                r: this.r,
                t: this.t,
                s: this.s,
                local_offset: this.local_offset,
                global_offset: this.global_offset
            };
        data[Ext.data.SyncModel.MODEL] = 'Ext.data.CSGenerator';
        return Ext.data.CSGenerator.superclass.as_data.call(this, data);
    }
});

Ext.data.CSV = Ext.extend(Ext.data.Config, {
    v: undefined,
    // array of change stamps
    constructor: function(config, callback, scope) {
        var changed = false;
        if (config) {
            config.config_id = 'csv';
            Ext.data.CSV.superclass.constructor.call(this, config);
            if (config.v) {
                this.v = [];
                this.do_add(config.v);
            }
        }
        if (this.v === undefined) {
            this.v = [];
            changed = true;
        }
        this.writeAndCallback(changed, callback, scope);
    },
    add: function(x, callback, scope) {
        var changed = this.do_add(x);
        this.writeAndCallback(changed, callback, scope);
        return this;
    },
    // JCM should force use of callback?
    get: function(cs) {
        return this.v[cs.r];
    },
    setReplicaNumber: function(replica_number, callback, scope) {
        this.addReplicaNumbers([
            replica_number
        ], callback, scope);
    },
    addReplicaNumbers: function(x, callback, scope) {
        var t = [];
        if (x instanceof Array) {
            t = Ext.data.array.collect(x, function(r) {
                return this.do_add(new Ext.data.CS({
                    r: r
                }));
            }, this);
        } else if (x instanceof Ext.data.CSV) {
            t = Ext.data.array.collect(x.v, function(cs) {
                return this.do_add(new Ext.data.CS({
                    r: cs.r
                }));
            }, this);
        }
        var changed = Ext.data.array.includes(t, true);
        this.writeAndCallback(changed, callback, scope);
    },
    do_add: function(x) {
        // CSV, CS, '1-2-3', [x]
        var changed = false;
        if (x instanceof Ext.data.CSV) {
            var t = Ext.data.array.collect(x.v, this.do_add, this);
            changed = Ext.data.array.includes(t, true);
        } else if (x instanceof Ext.data.CS) {
            var r = x.r;
            var t = this.v[r];
            if (!t || x.greaterThan(t)) {
                this.v[r] = new Ext.data.CS({
                    r: x.r,
                    t: x.t,
                    s: x.s
                });
                changed = true;
            }
        } else if (typeof x == 'string' || x instanceof String) {
            changed = this.do_add(new Ext.data.CS(x));
        } else if (x instanceof Array) {
            var t = Ext.data.array.collect(x, this.do_add, this);
            changed = Ext.data.array.includes(t, true);
        } else {
            throw "Error - CSV - do_add - Unknown type: " + (typeof x) + ": " + x;
        }
        return changed;
    },
    changeReplicaNumber: function(old_replica_number, new_replica_number, callback, scope) {
        var t = this.v[old_replica_number];
        var changed = false;
        if (t) {
            t.r = new_replica_number;
            this.v[old_replica_number] = undefined;
            this.v[new_replica_number] = t;
            changed = true;
        }
        this.writeAndCallback(changed, function() {
            callback.call(scope, this, changed);
        }, this);
    },
    isEmpty: function() {
        return this.v.length < 1;
    },
    maxChangeStamp: function() {
        if (!this.isEmpty()) {
            var r = new Ext.data.CS();
            this.v.forEach(function(cs) {
                var t = new Ext.data.CS({
                        t: cs.t,
                        s: cs.s
                    });
                r = (t.greaterThan(r) ? cs : r);
            }, this);
            return r;
        }
    },
    dominates: function(x) {
        return Ext.data.array.any(this.compare(x), function(i) {
            return i > 0;
        });
    },
    equals: function(x) {
        return Ext.data.array.all(this.compare(x), function(i) {
            return i === 0;
        });
    },
    compare: function(x) {
        var i, cs, r;
        if (x instanceof Ext.data.CS) {
            cs = this.get(x);
            return [
                cs ? cs.compare(x) : -1
            ];
        } else if (x instanceof Ext.data.CSV) {
            r = [];
            for (i in this.v) {
                cs = this.v[i];
                if (cs instanceof Ext.data.CS) {
                    var cs2 = x.get(cs);
                    r.push(cs2 ? cs.compare(cs2) : 1);
                }
            }
            return r;
        } else {
            throw "Error - CSV - compare - Unknown type: " + (typeof x) + ": " + x;
        }
        return [
            -1
        ];
    },
    forEach: function(fn, scope) {
        this.v.forEach(fn, scope || this);
    },
    encode: function() {
        // for the wire
        return Ext.data.array.collect(this.v, function() {
            // JCM can we safely ignore replicas with CS of 0... except for the highest known replica number...
            return this.to_s();
        });
    },
    decode: function(x) {
        // from the wire
        this.do_add(x);
        return this;
    },
    to_s: function(indent) {
        var r = "CSV: ";
        this.v.forEach(function(cs) {
            r += cs.to_s() + ", ";
        }, this);
        return r;
    },
    as_data: function() {
        // for the disk
        var data = {
                v: Ext.data.array.collect(this.v, function() {
                    return this.to_s();
                })
            };
        data[Ext.data.SyncModel.MODEL] = 'Ext.data.CSV';
        return Ext.data.CSV.superclass.as_data.call(this, data);
    }
});

Ext.data.Clock = Ext.extend(Object, {
    constructor: function() {
        this.epoch = new Date(2011, 0, 1);
    },
    now: function() {
        return this.ms_to_s(new Date().getTime() - this.epoch);
    },
    ms_to_s: function(ms) {
        return Math.floor(ms / 1000);
    }
});

Ext.data.Config = Ext.extend(Object, {
    config_id: undefined,
    write_fn: undefined,
    _id: undefined,
    constructor: function(config) {
        this.config_id = config.config_id;
        this.write_fn = config.write_fn;
        this._id = config._id;
    },
    set: function(data) {
        this._id = data._id;
    },
    to_s: function(indent) {
        return this.config_id + ": " + Ext.encode(this);
    },
    as_data: function(data) {
        data.id = this.config_id;
        data._id = this._id;
        data[Ext.data.SyncModel.OID] = data[Ext.data.SyncModel.OID] || this.config_id;
        return data;
    },
    writeAndCallback: function(changed, callback, scope) {
        if (changed) {
            this.write(function() {
                if (callback) {
                    callback.call(scope, this);
                }
            }, this);
        } else {
            if (callback) {
                callback.call(scope, this);
            }
        }
    },
    write: function(callback, scope) {
        if (this.write_fn) {
            this.write_fn(this, function() {
                if (callback) {
                    callback.call(scope, this);
                }
            }, this);
        } else {
            if (callback) {
                callback.call(scope, this);
            }
        }
    }
});

Ext.data.DatabaseDefinition = Ext.extend(Ext.data.Config, {
    key: undefined,
    // the developer's api key
    database_name: undefined,
    generation: undefined,
    // of the database
    system_name: undefined,
    // this system
    system_names: {},
    // other systems
    replica_number: undefined,
    idProperty: undefined,
    idPropertyDefaultValue: undefined,
    version: 1,
    // of the storage scheme
    // JCM include the epoch of the clock here?
    constructor: function(config, callback, scope) {
        //
        Ext.data.utilities.check('DatabaseDefinition', 'constructor', 'config', config, [
            'key',
            'database_name',
            'generation',
            'system_name',
            'replica_number'
        ]);
        //
        this.set(config);
        config.config_id = 'definition';
        Ext.data.DatabaseDefinition.superclass.constructor.call(this, config);
    },
    setReplicaNumber: function(replica_number, callback, scope) {
        var changed = (this.replica_number != replica_number);
        this.replica_number = replica_number;
        this.writeAndCallback(changed, callback, scope);
    },
    addSystemName: function(system_name) {
        this.system_names[system_name] = true;
    },
    // JCM this.writeAndCallback(changed,callback,scope);
    isKnownOf: function(system_name) {
        return this.system_name === system_name || Ext.data.array.includes(this.system_names, system_name);
    },
    set: function(config, callback, scope) {
        var changed = Ext.data.utilities.copy(config, this, [
                'key',
                'database_name',
                'generation',
                'system_name',
                'system_names',
                'replica_number',
                'idProperty',
                'idPropertyDefaultValue',
                'version',
                '_id'
            ]);
        this.writeAndCallback(changed, callback, scope);
    },
    as_data: function() {
        // to store on the disk
        var data = {
                key: this.key,
                database_name: this.database_name,
                generation: this.generation,
                system_name: this.system_name,
                system_names: this.system_names,
                replica_number: this.replica_number,
                idProperty: this.idProperty,
                idPropertyDefaultValue: this.idPropertyDefaultValue,
                version: this.version
            };
        data[Ext.data.SyncModel.MODEL] = 'Ext.data.DatabaseDefinition';
        return Ext.data.DatabaseDefinition.superclass.as_data.call(this, data);
    },
    encode: function() {
        // to send over the wire
        return {
            key: this.key,
            database_name: this.database_name,
            generation: this.generation,
            system_name: this.system_name,
            replica_number: this.replica_number,
            idProperty: this.idProperty,
            idPropertyDefaultValue: this.idPropertyDefaultValue
        };
    }
});
// JCM perhaps an explicit decode would be better than the constructor?

Ext.data.Protocol = Ext.extend(Object, {
    constructor: function(config) {
        this.remote = config.remoteStorageProxy;
        this.remote.on('exception', function(proxy, request, operation) {
            console.log('EXCEPTION');
            // JCM should handle this properly...
            console.log(request);
            console.log(operation);
        });
    },
    sync: function(local, callback, scope) {
        //
        // JCM callback if something is going to take a long time...
        // JCM like changing the replica number
        // JCM or clearing after a generation change
        //
        if (callback === undefined) {
            callback = function() {};
        }
        // JCM maybe should warn the caller...
        this.send_create_database(local.definition, function(operation) {
            var response = operation.response;
            switch (response.r) {
                case 'ok':
                    //
                    // The remote CSV describes the state of updated-ness of the
                    // server this client is talking to. We add any replica numbers
                    // that are new to us to our local CSV.
                    //
                    var remote_csv = response.csv;
                    local.addReplicaNumbers(remote_csv);
                    this.sync_datastore(local, remote_csv, callback, scope);
                    break;
                case 'new_replica_number':
                    //
                    // A replica number collision, or re-initialization, has occured. 
                    // In either case we must change our local replica number.
                    //
                    local.setReplicaNumber(response.replica_number, function() {
                        this.sync(local, callback, scope);
                    }, // JCM beware of infinite loop
                    this);
                    break;
                case 'new_generation_number':
                    //
                    // The database generation has changed. We clear out the database,
                    // and update the definition. 
                    //
                    if (response.generation > local.definition.generation) {
                        local.definition.set({
                            generation: response.generation
                        }, function() {
                            local.clear(function() {
                                this.sync(local, callback, scope);
                            }, // JCM beware of infinite loop
                            this);
                        }, this);
                    } else {};
                    // local is the same, or greater than the server.
                    break;
                default:
                    callback.call(scope);
                    break;
            }
        }, this);
    },
    // @private
    sync_datastore: function(local, remote_csv, callback, scope) {
        //
        // JCM In theory... we could send and receive at the same time...
        //
        local.getUpdates(remote_csv, function(updates) {
            this.put_database_updates(local.definition, updates, function(operation) {
                if (remote_csv.dominates(local.csv)) {
                    this.get_database_updates(local, callback, scope);
                } else {
                    callback.call(scope);
                }
            }, this);
        }, this);
    },
    send_create_database: function(definition, callback, scope) {
        var request = definition.encode();
        this.sendRequest(definition.database_name, 'edit', request, function(operation) {
            var response = operation.response;
            if (response.csv) {
                response.csv = new Ext.data.CSV().decode(response.csv);
            }
            callback.call(scope, operation);
        }, this);
    },
    put_database_updates: function(definition, updates, callback, scope) {
        //
        // When sending updates through the ScriptTagProxy the data is
        // encoded as a URL, so there is a browser imposed limit on the
        // length of that URL. So, let's be prudent and limit the amount
        // of data sent at a time.  
        //
        var chunks = updates.chunks(1000);
        // JCM count of updates... should be K?
        Ext.data.array.forEachYielding(chunks, function(chunk, next_callback, next_scope) {
            this.send_put_database_updates(definition, chunk, function(operation) {
                //if (operation.response.r=='ok') {
                //   keep going
                //} else {
                //   JCM abort... but how?
                //}
                next_callback.call(next_scope);
            }, this);
        }, this, callback, scope);
    },
    send_put_database_updates: function(definition, updates, callback, scope) {
        if (!updates.isEmpty()) {
            var request = {
                    updates: Ext.encode(updates.encode())
                };
            this.sendRequest(definition.database_name, 'put_updates', request, callback, scope);
        } else {
            var operation = this.encodeRequest({});
            operation.response = {
                r: "ok"
            };
            callback.call(scope, operation);
        }
    },
    get_database_updates: function(local, callback, scope) {
        this.send_get_database_updates(local.definition, local.csv, function(operation) {
            //
            // JCM perhaps an 'event' should be fired for each object changed
            // JCM which serves as a trigger for the UI to update
            //
            var response = operation.response;
            if (response.r == 'ok') {
                local.putUpdates(response.updates, function() {
                    if (response.remaining > 0 && !response.updates.isEmpty()) {
                        this.get_database_updates(local, callback, scope);
                    } else {
                        callback.call(scope);
                    }
                }, this);
            } else {
                callback.call(scope);
            }
        }, this);
    },
    send_get_database_updates: function(definition, csv, callback, scope) {
        var request = {
                csv: csv.encode()
            };
        this.sendRequest(definition.database_name, 'get_updates', request, function(operation) {
            var response = operation.response;
            response.updates = new Ext.data.Updates().decode(response.updates);
            callback.call(scope, operation);
        }, this);
    },
    sendRequest: function(database_name, method, request, callback, scope) {
        var operation = this.encodeRequest(database_name, method, request);
        var debug = true;
        // JCM
        if (debug) {
            console.log("local ->", this.remote.url, method, Ext.encode(request));
        }
        this.remote.read(operation, function(operation) {
            if (debug) {
                console.log("  sent", operation.request.url.length, "bytes -", operation.request.url);
                console.log("  <= ", method, Ext.encode(operation.response));
            }
            callback.call(scope, operation);
        }, this);
    },
    encodeRequest: function(database_name, method, request) {
        var text = Ext.encode(request);
        var url = this.remote.url + "database/" + database_name + "/" + method;
        return new Ext.data.Operation({
            filters: [],
            action: 'read',
            url: url,
            params: request
        });
        return operation;
    }
});

// this model is used to extend the user's own model.
// it adds the replication state.
Ext.data.SyncModel = {
    STATE: '_state',
    TOMBSTONE: '_ts',
    OID: '_oid',
    REF: '_ref',
    MODEL: '_model',
    state: undefined,
    createReplStorageModel: function(modelName) {
        // create the storage model, based on the user model
        var augmented_fields = this.fields.items.slice(0);
        augmented_fields = augmented_fields.concat([
            {
                name: '_state'
            },
            {
                name: '_ts'
            },
            {
                name: '_oid'
            },
            {
                name: '_ref'
            },
            {
                name: '_model'
            }
        ]);
        // JCM could the local storage proxy be added to the storage model...?
        var StorageModel = Ext.regModel("Sencha.StorageModel." + modelName, {
                fields: augmented_fields,
                idProperty: Ext.data.SyncModel.OID
            });
        return StorageModel;
    },
    oid: function() {
        return this.data[Ext.data.SyncModel.OID];
    },
    ref: function() {
        return this.data[Ext.data.SyncModel.REF];
    },
    userData: function() {
        var r = {};
        for (var i in this.data) {
            if (i[0] !== "_") {
                r[i] = this.data[i];
            }
        }
        return r;
    },
    isSystemModel: function() {
        var model_name = this.data[Ext.data.SyncModel.MODEL];
        return model_name !== undefined && model_name.indexOf("Ext.data.", 0) === 0;
    },
    changeReplicaNumber: function(old_replica_number, new_replica_number) {
        this.setup();
        var changed = false;
        this.forEachCS(this.state, function(cs) {
            var t = cs.changeReplicaNumber(old_replica_number, new_replica_number);
            changed = changed || t;
            return cs;
        }, this);
        var v = this.oid();
        if (v) {
            var id_cs = new Ext.data.CS(v);
            if (id_cs.changeReplicaNumber(old_replica_number, new_replica_number)) {
                this.data[Ext.data.SyncModel.OID] = id_cs.to_s();
                changed = true;
            }
        }
        return changed;
    },
    setCreateState: function(generator) {
        this.state = {};
        var cs = generator();
        this.setPair(Ext.data.SyncModel.OID, cs.to_s(), cs);
        this.forEachValue(this.data, [], function(path, value) {
            if (path[0] !== Ext.data.SyncModel.OID) {
                this.setCS(path, generator());
            }
        }, this);
    },
    setUpdateState: function(generator) {
        var changes = this.getChanges(),
            name;
        for (name in changes) {
            if (name !== Ext.data.SyncModel.STATE && name !== Ext.data.SyncModel.OID) {
                this.setUpdateStateValue([
                    name
                ], this.modified[name], changes[name], generator);
            }
        }
    },
    setUpdateStateValue: function(path, before_value, after_value, generator) {
        //console.log('setUpdateStateValue',path,before_value,after_value)
        if (this.isComplexValueType(after_value)) {
            if (before_value) {
                var added = {};
                if (this.isComplexValueType(before_value)) {
                    if (this.valueType(before_value) === this.valueType(after_value)) {
                        added = Ext.data.utilities.minus(after_value, before_value);
                        var changed = Ext.data.utilities.intersection(after_value, before_value);
                        for (var name2 in changed) {
                            if (changed.hasOwnProperty(name2)) {
                                if (before_value[name2] !== after_value[name2]) {
                                    added[name2] = after_value[name2];
                                }
                            }
                        }
                    } else {
                        added = after_value;
                        this.setCS(path, generator());
                    }
                } else // value had a different type before, a complex type
                {
                    added = after_value;
                    this.setCS(path, generator());
                }
            } else // value had a different type before, a primitive type
            {
                added = after_value;
                this.setCS(path, generator());
            }
            // value didn't exist before
            for (var name2 in added) {
                if (added.hasOwnProperty(name2)) {
                    var next_before_value = before_value ? before_value[name2] : undefined;
                    this.setUpdateStateValue(path.concat(name2), next_before_value, after_value[name2], generator);
                }
            }
        } else {
            this.setCS(path, generator());
        }
    },
    // value has a primitive type
    setDestroyState: function(generator) {
        var cs = generator();
        this.data[Ext.data.SyncModel.TOMBSTONE] = cs.to_s();
        this.setCS(Ext.data.SyncModel.TOMBSTONE, cs);
    },
    isNotDestroyed: function() {
        // test if a record has been deleted
        var t = this.data[Ext.data.SyncModel.TOMBSTONE];
        return (t === undefined || t === '');
    },
    getUpdates: function(csv) {
        //console.log('updates',Ext.encode(csv))
        this.setup();
        var updates = [];
        var oid = this.oid();
        this.forEachPair(this.data, this.state, [], [], function(path, values, cs) {
            if (cs) {
                var cs2 = csv.get(cs);
                if (!cs2 || cs2.lessThan(cs)) {
                    updates.push({
                        i: oid,
                        p: path.length == 1 ? path[0] : path,
                        v: values.length == 1 ? values[0] : values,
                        c: cs
                    });
                }
            }
        }, this);
        //console.log('updates =>',Ext.encode(updates))
        return updates;
    },
    putUpdate: function(update) {
        //console.log('applyUpdate',update)
        return this.setPair(update.p, update.v, update.c);
    },
    equals: function(r) {
        this.forEachPair(this.data, this.state, [], [], function(path, values, cs) {
            var p = r.getPair(path);
            var value = values[values.length - 1];
            if (!(cs.equals(r.c) && value === r.v)) {
                return false;
            }
        }, this);
        return true;
    },
    forEachPair: function(data, state, path, values, callback, scope) {
        //console.log('forEachPair',Ext.encode(data),Ext.encode(state),Ext.encode(path),Ext.encode(values));
        this.setup();
        for (var name in state) {
            if (state.hasOwnProperty(name)) {
                var new_state = state[name];
                var new_data = data[name];
                var new_path = path.concat(name);
                var new_data_type = this.valueType(new_data);
                var new_value;
                switch (new_data_type) {
                    case 'object':
                        new_value = {};
                        break;
                    case 'array':
                        new_value = [
                            []
                        ];
                        break;
                    default:
                        new_value = new_data;
                }
                var new_values = values.concat(new_value);
                switch (this.valueType(new_state)) {
                    case 'string':
                        callback.call(scope, new_path, new_values, new Ext.data.CS(new_state));
                        break;
                    case 'array':
                        switch (new_data_type) {
                            case 'undefined':
                                console.log('Warning - There was no data for the state at path', new_path);
                                console.log('Warning -', Ext.encode(this.data));
                                break;
                            case 'object':
                            case 'array':
                                callback.call(scope, new_path, new_values, new Ext.data.CS(new_state[0]));
                                // [cs,state]
                                this.forEachPair(new_data, new_state[1], new_path, new_values, callback, scope);
                                // [cs,state]
                                break;
                            default:
                                callback.call(scope, new_path, new_values, new Ext.data.CS(new_state[0]));
                                // [cs,state]
                                break;
                        };
                        break;
                }
            }
        }
    },
    forEachValue: function(data, path, callback, scope) {
        var n, v;
        for (n in data) {
            if (data.hasOwnProperty(n)) {
                v = data[n];
                if (v !== this.state) {
                    var path2 = path.concat(n);
                    callback.call(scope, path2, v);
                    if (this.isComplexValueType(v)) {
                        this.forEachValue(v, path2, callback, scope);
                    }
                }
            }
        }
    },
    getCSV: function() {
        var csv = new Ext.data.CSV();
        this.forEachCS(this.state, function(cs) {
            csv.add(cs);
        }, this);
        return csv;
    },
    forEachCS: function(state, callback, scope) {
        var name, next_state, cs;
        for (name in state) {
            if (state.hasOwnProperty(name)) {
                next_state = state[name];
                switch (this.valueType(next_state)) {
                    case 'string':
                        cs = callback.call(scope, new Ext.data.CS(next_state));
                        if (cs) {
                            state[name] = cs.to_s();
                        };
                        break;
                    case 'array':
                        cs = callback.call(scope, new Ext.data.CS(next_state[0]));
                        if (cs) {
                            state[name][0] = cs.to_s();
                        };
                        // [cs,state]
                        this.forEachCS(next_state[1], callback, scope);
                        // [cs,state]
                        break;
                }
            }
        }
    },
    getCS: function(path) {
        this.setup();
        var state = this.state;
        if (Ext.isArray(path)) {
            var l = path.length;
            var e = l - 1;
            for (var i = 0; i < l; i++) {
                var name = path[i];
                if (i === e) {
                    return this.do_getCS(state, name);
                } else {
                    state = this.do_getState(state, name);
                }
            }
        } else {
            return this.do_getCS(state, path);
        }
    },
    do_getCS: function(state, name) {
        var cs = undefined;
        state = state[name];
        if (state) {
            switch (this.valueType(state)) {
                case 'string':
                    cs = new Ext.data.CS(state);
                    break;
                case 'array':
                    cs = new Ext.data.CS(state[0]);
                    // [cs,state]
                    break;
                default:
                    console.log("Error - SyncModel - do_getCS - unexpected type in state for", name, ":", typeof state, state);
                    console.log('state', Ext.encode(this.data));
                    cs = new Ext.data.CS();
                    break;
            }
        }
        // else undefined
        return cs;
    },
    setCS: function(path, cs) {
        //console.log('setCS',Ext.isArray(path) ? path.join() : path,cs.to_s())
        this.setup();
        var state = this.state;
        if (Ext.isArray(path)) {
            var l = path.length;
            var e = l - 1;
            for (var i = 0; i < l; i++) {
                var name = path[i];
                if (i === e) {
                    this.do_setCS(state, name, cs);
                } else {
                    state = this.do_getState(state, name);
                }
            }
        } else {
            this.do_setCS(state, path, cs);
        }
    },
    do_setCS: function(state, name, cs) {
        var cs_s = (cs instanceof Ext.data.CS) ? cs.to_s() : cs;
        var state2 = state[name];
        if (state2) {
            switch (this.valueType(state2)) {
                case 'string':
                    state[name] = cs_s;
                    break;
                case 'array':
                    state2[0] = cs_s;
                    // [cs,state]
                    break;
                default:
                    console.log("Error - SyncModel - do_setCS - unexpected type in state for", name, ":", typeof state2, state2);
                    console.log('state', Ext.encode(state));
                    console.log('name', name, 'cs', cs_s);
                    state[name] = cs_s;
            }
        } else {
            state[name] = cs_s;
        }
    },
    //console.log('do_setCS',name,cs_s,Ext.encode(state))
    getPair: function(path) {
        this.setup();
        var data = this.data;
        var state = this.state;
        if (Ext.isArray(path)) {
            var l = path.length;
            var e = l - 1;
            for (var i = 0; i < l; i++) {
                var name = path[i];
                if (i === e) {
                    return {
                        v: data ? data[name] : data,
                        c: this.do_getCS(state, name)
                    };
                } else {
                    state = this.do_getState(state, name);
                    data = data ? data[name] : data;
                }
            }
        } else {
            return {
                v: data[path],
                c: this.do_getCS(state, path)
            };
        }
    },
    setPair: function(path, values, new_cs) {
        //console.log('setPair',Ext.encode(path),Ext.encode(values),Ext.encode(new_cs));
        //console.log('setPair',Ext.encode(this.data));
        var changed = false;
        this.setup();
        if (!Ext.isArray(path)) {
            path = [
                path
            ];
            values = [
                values
            ];
        }
        var data = this.data;
        var state = this.state;
        var l = path.length;
        var e = l - 1;
        for (var i = 0; i < l; i++) {
            var name = path[i];
            var new_value = values[i];
            var old_cs = this.do_getCS(state, name);
            var old_value = data[name];
            var old_value_type = this.valueType(old_value);
            var new_value_type = this.valueType(new_value);
            var sameComplexType = ((old_value_type === 'object' && new_value_type === 'object') || (old_value_type === 'array' && new_value_type === 'array'));
            if (old_cs) {
                if (new_cs.greaterThan(old_cs)) {
                    if (sameComplexType) {
                        new_value = undefined;
                    }
                    // re-assert, don't overwrite
                    // new_cs is gt old_cs, so accept update
                    if (this.do_setPair(data, state, name, new_value, new_cs)) {
                        changed = true;
                    }
                } else {
                    // new_cs is not gt old_cs
                    if (sameComplexType) {} else // but this value type along the path is the same, so keep going...
                    {
                        // and this type along the path is not the same, so reject the update.
                        return changed;
                    }
                }
            } else {
                // no old_cs, so accept update
                if (this.do_setPair(data, state, name, new_value, new_cs)) {
                    changed = true;
                }
            }
            if (i !== e) {
                data = this.do_getData(data, name);
                state = this.do_getState(state, name, new_cs);
            }
        }
        //console.log('setPair => ',Ext.encode(this.data));
        return changed;
    },
    do_getState: function(state, name, cs) {
        var next_state = state[name];
        switch (this.valueType(next_state)) {
            case 'undefined':
                var new_state = {};
                state[name] = [
                    cs,
                    new_state
                ];
                state = new_state;
                break;
            case 'string':
                var new_state = {};
                state[name] = [
                    next_state,
                    new_state
                ];
                state = new_state;
                break;
            case 'array':
                state = next_state[1];
                break;
            default:
                throw "Error - SyncModel - do_getState - unexpected type in state: " + (typeof next_state) + " " + next_state;
        }
        return state;
    },
    do_setPair: function(data, state, name, new_value, new_cs) {
        var changed = false;
        if (new_value !== undefined) {
            this.do_setData(data, name, new_value);
            changed = true;
        }
        if (new_cs !== undefined) {
            this.do_setCS(state, name, new_cs);
            changed = true;
        }
        return changed;
    },
    do_getData: function(data, name) {
        return data[name];
    },
    do_setData: function(data, name, value) {
        //console.log(Ext.encode(data),"[",name,"]=",Ext.encode(value));
        data[name] = value;
    },
    valueType: function(value) {
        // returns undefined, number, boolean, string, object, array
        var t = typeof value;
        if (t === 'object' && (value instanceof Array)) {
            t = 'array';
        }
        return t;
    },
    valueEquals: function(v1, v2) {
        var r = false;
        var t1 = this.valueType(v1);
        var t2 = this.valueType(v2);
        if (t1 === t2) {
            switch (t1) {
                case 'object':
                case 'array':
                    r = Ext.encode(v1) === Ext.encode(v2);
                    // JCM I'm sure there's a better way to do this...
                    break;
                default:
                    r = v1 === v2;
            }
        }
        return r;
    },
    isComplexValueType: function(value) {
        // return true for an object or an array
        return (typeof value === 'object');
    },
    setup: function() {
        this.data[Ext.data.SyncModel.STATE] = this.data[Ext.data.SyncModel.STATE] || {};
        this.state = this.data[Ext.data.SyncModel.STATE];
    }
};

Ext.data.UUIDGenerator = {
    generate: function() {
        // totally random uuid
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 3 | 8);
            return v.toString(16);
        });
    }
};

// JCM this 'class' could help with batching updates to be sent to the server
Ext.data.Updates = Ext.extend(Object, {
    updates: undefined,
    constructor: function(x) {
        //
        // sort the updates into change stamp order,
        // as they have to be transmitted this way
        //
        this.updates = x || [];
        this.updates.forEach(function(update) {
            if (!(update.c instanceof Ext.data.CS)) {
                update.c = new Ext.data.CS(update.c);
            }
        });
        this.updates.sort(function(a, b) {
            return a.c.compare(b.c);
        });
    },
    push: function(update) {
        // update must have a cs greater than the last element
        var last = this.updates[this.updates.length];
        if (update.c.lessThan(last)) {
            throw "Error - Updates - Tried to push updates in wrong order. " + last + " " + update;
        }
        this.updates.push(update);
    },
    isEmpty: function() {
        return this.updates.length < 1;
    },
    forEach: function(callback, scope) {
        this.updates.forEach(callback, scope);
    },
    forEachAsync: function(each_callback, each_scope, done_callback, done_scope) {
        Ext.data.array.forEachAsync(this.updates, each_callback, each_scope, done_callback, done_scope);
    },
    limit: function(n) {
        var r = Math.max(0, this.updates.length - n);
        if (r > 0) {
            this.updates = this.updates.slice(0, n);
        }
        return r;
    },
    chunks: function(chunk_size) {
        var r = [];
        var l = this.updates.length;
        var n = (l / chunk_size) + 1;
        for (var i = 0; i < n; i++) {
            var start = i * chunk_size;
            var end = start + chunk_size;
            var t = new Ext.data.Updates();
            t.updates = this.updates.slice(start, end);
            r.push(t);
        }
        return r;
    },
    decode: function(x) {
        this.updates = [];
        if (x) {
            var l = x.length;
            var update, prev_i, id, p, v, c;
            for (var i = 0; i < l; i++) {
                update = x[i];
                switch (update.length) {
                    case 3:
                        id = prev_i;
                        p = update[0];
                        v = update[1];
                        c = update[2];
                        break;
                    case 4:
                        id = update[0];
                        p = update[1];
                        v = update[2];
                        c = update[3];
                        prev_i = id;
                        break;
                }
                c = ((c instanceof Ext.data.CS) ? c : new Ext.data.CS(c));
                this.updates.push({
                    i: id,
                    p: p,
                    v: v,
                    c: c
                });
            }
        }
        return this;
    },
    encode: function() {
        // JCM optimize - "" around i and p and cs is not needed
        // JCM optimize - diff encode cs 1-123, +1-0, +0-1, 1-136-4, +1-0, ...
        var r = [];
        var l = this.updates.length;
        var prev_i, update, cs;
        for (var i = 0; i < l; i++) {
            update = this.updates[i];
            cs = ((update.c instanceof Ext.data.CS) ? update.c.to_s() : update.c);
            if (update.i === prev_i) {
                r.push([
                    update.p,
                    update.v,
                    cs
                ]);
            } else {
                r.push([
                    update.i,
                    update.p,
                    update.v,
                    cs
                ]);
                prev_i = update.i;
            }
        }
        return r;
    }
});

Ext.data.utilities = {
    delegate: function(from_instance, to_instance, methods) {
        if (to_instance === undefined) {
            throw "Error - Tried to delegate '" + methods + "' to undefined instance.";
        }
        methods.forEach(function(method) {
            var to_method = to_instance[method];
            if (to_method === undefined) {
                throw "Error - Tried to delegate undefined method '" + method + "' to " + to_instance;
            }
            from_instance[method] = function() {
                return to_method.apply(to_instance, arguments);
            };
        });
    },
    apply: function(instance, methods, a, done_callback, done_scope) {
        var first = true;
        Ext.data.array.forEachAsync(methods, function(method, next_callback, next_scope) {
            if (first) {
                a.push(next_callback);
                a.push(next_scope);
                first = false;
            }
            instance[method].apply(instance, a);
        }, instance, done_callback, done_scope);
    },
    copy: function(from_instance, to_instance, properties) {
        var changed = false;
        properties.forEach(function(property) {
            var from_v = from_instance[property];
            var to_v = to_instance[property];
            if (from_v !== undefined && from_v !== to_v) {
                to_instance[property] = from_v;
                changed = true;
            }
        });
        return changed;
    },
    copyIfUndefined: function(from_instance, to_instance, properties) {
        var changed = false;
        properties.forEach(function(property) {
            var from_v = from_instance[property];
            var to_v = to_instance[property];
            if (from_v !== undefined && to_v === undefined) {
                to_instance[property] = from_v;
                changed = true;
            }
        });
        return changed;
    },
    check: function(class_name, method_name, instance_name, instance, properties) {
        if (instance === undefined) {
            var message = "Error - " + class_name + "." + method_name + " - " + instance_name + " not provided.";
            console.log(message);
            throw message;
        } else {
            properties.forEach(function(property) {
                var value = instance[property];
                if (value === undefined) {
                    var message = "Error - " + class_name + "." + method_name + " - " + instance_name + "." + property + " not provided.";
                    console.log(message);
                    throw message;
                }
            });
        }
    },
    minus: function(a, b) {
        // minus(a,b) is all the name value pairs in a that are not in b 
        var n,
            r = {};
        for (n in a) {
            if (a.hasOwnProperty(n)) {
                if (b[n] === undefined) {
                    r[n] = a[n];
                }
            }
        }
        return r;
    },
    intersection: function(a, b) {
        var n,
            r = {};
        for (n in a) {
            if (a.hasOwnProperty(n)) {
                if (b[n] !== undefined) {
                    r[n] = a[n];
                }
            }
        }
        return r;
    }
};


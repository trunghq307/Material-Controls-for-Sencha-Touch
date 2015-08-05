# Material Design Controls For Sencha Touch

This project wants to create easy to use Sencha Touch controls using the look and feel of the [Google Material Design](http://www.google.com/design/spec/material-design/introduction.html) guidelines.

Please feel free to make any pull requests.

Component List
-----
- [x] Button
- [x] TextField
- [x] Progress
- [x] Select
- [x] Slider
- [x] Toggle
- [x] TabBar
- [x] List
- [x] MessageBox
- [x] Checkbox
- [x] DatePicker

#### Button
<p align="center">
<img style="-webkit-user-select: none;" src="https://github.com/fpt-software/Material-Controls-for-Sencha-Touch/blob/master/Images/Button.gif">
</p>

#### TextField
<p align="center">
<img style="-webkit-user-select: none;" src="https://github.com/fpt-software/Material-Controls-for-Sencha-Touch/blob/master/Images/TextField.gif">
</p>

#### Progress
<p align="center">
<img style="-webkit-user-select: none;" src="https://github.com/fpt-software/Material-Controls-for-Sencha-Touch/blob/master/Images/Progress.gif">
</p>

#### Select
<p align="center">
<img style="-webkit-user-select: none;" src="https://github.com/fpt-software/Material-Controls-for-Sencha-Touch/blob/master/Images/Select.gif">
</p>

#### Slider
<p align="center">
<img style="-webkit-user-select: none;" src="https://github.com/fpt-software/Material-Controls-for-Sencha-Touch/blob/master/Images/Slider.gif">
</p>

#### Toggle
<p align="center">
<img style="-webkit-user-select: none;" src="https://github.com/fpt-software/Material-Controls-for-Sencha-Touch/blob/master/Images/Toggle.gif">
</p>

#### TabBar
<p align="center">
<img style="-webkit-user-select: none;" src="https://github.com/fpt-software/Material-Controls-for-Sencha-Touch/blob/master/Images/Tab.gif">
</p>

#### List
<p align="center">
<img style="-webkit-user-select: none;" src="https://github.com/fpt-software/Material-Controls-for-Sencha-Touch/blob/master/Images/List.gif">
</p>

#### MessageBox
<p align="center">
<img style="-webkit-user-select: none;" src="https://github.com/fpt-software/Material-Controls-for-Sencha-Touch/blob/master/Images/Messagebox.gif">
</p>

#### Checkbox
<p align="center">
<img style="-webkit-user-select: none;" src="https://github.com/fpt-software/Material-Controls-for-Sencha-Touch/blob/master/Images/Checkbox.gif">
</p>

#### DatePicker
<p align="center">
<img style="-webkit-user-select: none;" src="https://github.com/fpt-software/Material-Controls-for-Sencha-Touch/blob/master/Images/DatePicker.gif">
</p>

# Get Started
<p>1. Copy Material package into Pakages folder of your Sencha Touch project</p>
	Path: SenchaUI/packages/Material
<p>2. Add SASS references as bellow;</p>
	@import 'sencha-touch/default';
	@import 'sencha-touch/default/all';
	@import '../../packages/Material/sass/src/Material.scss';
	@include md-ripple;
	
	Add 'mixin' for the control you want to use
	@include md-button;
	@include md-text-field;
	@include md-toggle;
	@include md-slide;
	@include md-tab;
	@include md-checkbox;
	@include md-message-box;
	@include md-progress-circular;
	@include md-toolbar;
	@include md-select;
	@include md-date-picker;
<p>3. Run package build command from Material package folder</p>
	sencha package build
<p>4. And build your application again</p>
	sencha app build
<p>After this, all of default control in your project should be change to Material style</p>
<p>Run the samples of SenchaUI project for more details</p>


Provided by [FPT Software](http://www.fpt-software.com/)

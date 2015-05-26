# Visto JavaScript Framework (VistoJS)

The Visto JavaScript Framework (VistoJS) integrates [KnockoutJS](http://knockoutjs.com), [JQuery](http://jquery.com),  [RequireJS](http://www.requirejs.org), [Q promises](https://github.com/kriskowal/q) and [TypeScript](http://www.typescriptlang.org) to provide a clean MVVM programming model known from .NET XAML to implement single-page applications: It is possible to implement views with "code-behind" and bindings to view models, declaratively load subviews in HTML and navigate between pages. 

The main advantages of the library is that it allows you to develop component-based and implement reusable views which are composed of predefined programming blocks (view, view model and HTML). These views can be reused as sub views, in dialogs or as page instances. The programming API and paradigm is very similar to the one found in Windows Phone XAML or Windows 8 Store Apps programming (MVVM pattern, view "code-behind", paging/navigation).

[Introduction to the Visto JavaScript Framework](https://github.com/VistoJS/Core/wiki/Introduction)

[Documentation Wiki](https://github.com/VistoJS/Core/wiki)

[Live demo application](https://rawgit.com/VistoJS/Core/master/Visto/index.html)

## Features

- Support for views with "code-behind" and view models (declared using HTML) 
    - Support for **event methods** on views and view models like "loaded", "onNavigatedTo", etc. 
    - The view model and the view are connected using **KnockoutJS bindings** 
    - Load sub views declaratively using **custom tags** and pass parameters which may be one-way and two-way bound
    - Instantiate multiple instances of the same view 
    - No "page build-up flickering" by displaying a view not until every sub view has been loaded
- Support for **stack-based paging** and **dialogs** 
    - The framework automatically calls onNavigateTo, loaded, destroy and other event methods
    - More maintainable and understandable code by **enforcing structure and conventions**
        - The resulting application is component based and different application areas can be grouped in packages
- Support for **declarative UI internationalization**
    - Declarative internationalization (with the `data-translate` attribute) to automatically update the UI when the language changed
    - Immediate language changes using "language bindings" which are also usable in code
- Visto.js file size is 18kb minimized (22kb debug)
    - Complete framework (with all libraries like JQuery, JQuery UI, KnockoutJS, RequireJS, etc.)
        - With JQuery UI (needed for dialogs): 388kb 
        - Without JQuery UI: 165kb (it is possible to provide an own dialog implementation)

## Dependencies and used technologies

- [KnockoutJS](http://knockoutjs.com): Provides bindings to HTML and JavaScript (needed for MVVM support) 
- [JQuery](http://jquery.com): DOM and HTML manipulations
- [RequireJS](http://www.requirejs.org): Used for module (AMD) loading and dependency management 
- Hashchange to detect user back navigation 
- (optional) [JQuery UI](http://jqueryui.com) for  dialogs

The Visto JavaScript Library is designed to be used with [TypeScript](http://www.typescriptlang.org) but is fully working with vanilla JavaScript. 

## First steps

To play with the sample application, [download](https://github.com/VistoJS/Core/archive/master.zip) or clone the project and open `Visto/index.html` to execute the sample project in your browser. Open the Visual Studio solution `Visto.sln` to start developing on the sample application (TypeScript must be installed). 

The "common" package provides some reusable controls/views; the package is not required to use the Visto JavaScript Library. 

**Important:** By default, IIS Express does not allow accessing JSON files from the server. The language JSON files are loaded from the browser and thus you have to enable them in the IIS configuration: You simply have to add the following line to the `<StaticContent>` tag in your applicationhost.config (`Documents\IISExpress\config\...`) configuration: 

    <mimeMap fileExtension=".json" mimeType="application/json" />
    
## Installation

1. Install [TypeScript 1.4 for Visual Studio 2013](https://visualstudiogallery.msdn.microsoft.com/2d42d8dc-e085-45eb-a30b-3f7d50d55304)
2. Create a new, empty ASP.NET web project with TypeScript support
3. Edit project properties, go to the "TypeScript Build" section and set the "Module system" to "AMD" 
4. Install the NuGet package [VistoJS.Complete](http://www.nuget.org/packages/VistoJS.Complete/)

## Final notes

The Visto JavaScript framework is developed and maintained by [Rico Suter](http://rsuter.com). 

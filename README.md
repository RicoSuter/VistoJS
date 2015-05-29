# Visto JavaScript Framework (VistoJS)

The Visto JavaScript Framework (VistoJS) is an MVVM-based application framework to implement single-page Web applications. The framework integrates [KnockoutJS](http://knockoutjs.com), [JQuery](http://jquery.com),  [RequireJS](http://www.requirejs.org), [Q promises](https://github.com/kriskowal/q) and [TypeScript](http://www.typescriptlang.org) to provide a clean, convention-based MVVM programming model inspired by .NET/XAML: Implement views with bindings to view models and "code-behind" classes, declaratively load sub views in HTML with custom tags or navigate between pages in a stack-based frame. 

- [Introduction to the Visto JavaScript Framework](https://github.com/VistoJS/Core/wiki/Introduction)

- [Framework and API documentation](https://github.com/VistoJS/Core/wiki)

- [Demo application](https://rawgit.com/VistoJS/Core/master/Visto/index.html) (based on the latest source code)

## Features

- Support for composable views with "code-behind" classes and view models (declared using HTML) 
    - Support for **event methods** on views and view models like `onLoaded()`, `onNavigatedTo()`, etc. 
    - The view models are bound to the views using **KnockoutJS bindings** 
    - Load sub views declaratively using **custom tags** and pass one-way or two-way bound parameters
    - Instantiate multiple instances of the same view for example in repeating lists
    - No "build-up flickering" by displaying a view not until every sub view has been loaded
- Support for **stack-based paging** and **dialogs** 
    - The framework automatically calls `onNavigateTo()`, `onLoaded()`, `destroy()` and other event methods
- More maintainable and understandable code by **enforcing structure and conventions**
    - The resulting application is component based
    - Application areas can be grouped in packages
- Support for **declarative UI internationalization**
    - Declaratively translate your UI with the `vs-translate` attribute which automatically updates the UI when the language changes
    - "Language bindings" can also be programmatically used in code
- Visto.js file size is 30kb minimized (54kb debug)

## Dependencies and used libraries

The framework depends on the following 3rd party ilbraries: 

- [KnockoutJS](http://knockoutjs.com): Bindings between HTML and JavaScript view models (needed for MVVM support) 
- [JQuery](http://jquery.com): DOM and HTML manipulations
- JQuery.Hashchange: Detect user back navigation 
- [RequireJS](http://www.requirejs.org): AMD module loading and dependency management 
- [Q](https://github.com/kriskowal/q): Promises/A+ support 

The Visto JavaScript Library is designed to be used with [TypeScript](http://www.typescriptlang.org) but is fully working with plain JavaScript. 

## First steps

To play with the sample application, [download](https://github.com/VistoJS/Core/archive/master.zip) or clone the project and open `Visto/index.html` to execute the sample project in your browser. Open the Visual Studio solution `Visto.sln` to start developing on the sample application (TypeScript must be installed). 

The "common" package provides some reusable controls and views. The package is not required to use the Visto JavaScript Library. The views in this package require the [Bootstrap](http://getbootstrap.com) UI framework.

## Installation

1. Install [TypeScript 1.4 for Visual Studio 2013](https://visualstudiogallery.msdn.microsoft.com/2d42d8dc-e085-45eb-a30b-3f7d50d55304)
2. Create a new, empty ASP.NET web project with TypeScript support
3. Edit project properties, go to the "TypeScript Build" section and 
    - Disable "Allow implicit 'any' types"
    - Set the "Module system" to "AMD" 
4. Install the NuGet package [VistoJS.Complete](http://www.nuget.org/packages/VistoJS.Complete/) or [VistoJS](http://www.nuget.org/packages/VistoJS/)
5. Add the following configuration to your `Web.config` so that JSON files are correctly served: 

        <system.webServer>
            <staticContent>
                <remove fileExtension=".json" />
                <mimeMap fileExtension=".json" mimeType="application/json" />
            </staticContent>
        </system.webServer>

## Final notes

The Visto JavaScript framework is currently developed and maintained by [Rico Suter](http://rsuter.com). 

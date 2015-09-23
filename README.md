# Visto JavaScript Framework (VistoJS)

[![NuGet Version](http://img.shields.io/nuget/v/VistoJS.svg?style=flat)](https://www.nuget.org/packages?q=VistoJS) 

The Visto JavaScript Framework (VistoJS) is an MVVM-based application framework to implement single-page Web applications. The framework integrates [KnockoutJS](http://knockoutjs.com), [JQuery](http://jquery.com),  [RequireJS](http://www.requirejs.org), [Q Promises](https://github.com/kriskowal/q) and [TypeScript](http://www.typescriptlang.org) to provide a clean, convention-based MVVM programming model inspired by .NET/XAML: Implement views with "code-behind" classes and bindings to view models, declaratively load sub views in HTML with custom tags or navigate between pages in a stack-based frame. 

- [Introduction to the Visto JavaScript Framework](https://github.com/VistoJS/Core/wiki/Introduction)

- [Framework and API documentation](https://github.com/VistoJS/Core/wiki)

- [Demo application](https://rawgit.com/VistoJS/VistoJS/master/src/Visto/index.html) (based on the [latest source code](https://github.com/VistoJS/VistoJS/tree/master/src/Visto))

(This project has originally been hosted on [CodePlex](http://visto.codeplex.com/))

## Features

The framework provides the following key features: 

- Support for composable views with ["code-behind" classes](https://github.com/VistoJS/Core/wiki/View) and [view models](https://github.com/VistoJS/Core/wiki/View-Model)
    - The appereance of the views are [declared using HTML](https://github.com/VistoJS/Core/wiki/View-HTML)
    - Support for [event methods](https://github.com/VistoJS/Core/wiki/Event-Methods) on views and view models like `onLoaded()`, `onNavigatedTo()`, etc. 
    - The view models are bound to the views using [KnockoutJS bindings](https://github.com/VistoJS/Core/wiki/Bindings) 
    - Load sub views declaratively using [custom tags](https://github.com/VistoJS/Core/wiki/Custom-Tags) and pass one-way or two-way bound parameters
    - Instantiate multiple instances of the same view for example in repeating lists
    - No "build-up flickering" by displaying a view not until every sub view has been loaded
- Support for [stack-based paging](https://github.com/VistoJS/Core/wiki/Paging) and [dialogs](https://github.com/VistoJS/Core/wiki/Dialogs) 
    - The framework automatically calls `onNavigateTo()`, `onLoaded()`, `destroy()` and other event methods
    - The browser history is correctly handled and the page stack can be restored from an URL
- More maintainable and understandable code by **enforcing structure and conventions**
    - The resulting application is component based
    - Views can be grouped into [packages](https://github.com/VistoJS/Core/wiki/Package)
- Support for [declarative UI internationalization](https://github.com/VistoJS/Core/wiki/Internationalization)
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
- (The sample application requires the [Bootstrap](http://getbootstrap.com) UI framework)

The Visto JavaScript Library is designed to be used with [TypeScript](http://www.typescriptlang.org) but is fully working with plain JavaScript. 

## First steps

To play with the sample application, [download](https://github.com/VistoJS/Core/archive/master.zip) or clone the project and open `Visto/index.html` to execute the sample project in your browser. Open the Visual Studio solution `Visto.sln` to start developing on the sample application (TypeScript must be installed). 

The ["common" package](https://github.com/VistoJS/Core/wiki/common-Package) provides some reusable controls and views. The package is not required to use the Visto JavaScript Library. Some methods and views in this package require the [Bootstrap](http://getbootstrap.com) UI framework.

## Installation

To create an empty Visual Studio project with the framework installed: 

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

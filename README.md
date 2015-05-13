# Visto JavaScript Framework (VistoJS)

The Visto JavaScript Framework (VistoJS) integrates  KnockoutJS, JQuery and  RequireJS (and TypeScript) to provide the programming model known from .NET XAML and MVVM application development: It is possible to implement views with "code-behind" and bindings to view models, declaratively load subviews in HTML and navigate between pages - all in a single-page application. 

 The main advantages of this library is that it allows to develop component-based and implement reusable views which are composed of predefined programming blocks (view, view model and HTML). These views can be reused as sub views, in dialogs or as page instances. The programming API and paradigm is very similar to the one found in Windows Phone XAML or Windows 8 Store Apps programming (MVVM pattern, view "code-behind", paging/navigation).

[Introduction to the Visto JavaScript Framework](https://github.com/VistoJS/Core/wiki/Introduction)

## Features

- Support for views with "code-behind" and view models (declared using HTML) 
    - Support for  event methods on views and view models like "loaded", "onNavigatedTo", etc. 
    - The view model and the view are connected using KnockoutJS bindings 
    - Load sub views declaratively using **custom tags** and pass parameters which may be one-way and two-way bound
    - Instantiate multiple instances of the same view 
    - No "page build-up flickering" by displaying a view not until every sub view has been loaded
- Support for stack-based  paging and  dialogs 
    - The framework automatically calls onNavigateTo, loaded, destroy and other  event methods
    - More maintainable and understandable code by enforcing structure and conventions 
        - The resulting application is component based and different application areas can be grouped in packages
- Support for GUI  internationalization 
    - Declarative internationalization (with the data-translate attribute) which automatically updates if the language is changed 
    - Immediate language changes using "language bindings"
- Visto.js file size is 18kb minimized (22kb debug)
    - Complete framework (with all libraries like JQuery, JQuery UI, KnockoutJS, RequireJS, etc.)
        - With JQuery UI (needed for dialogs): 388kb 
        - Without JQuery UI: 165kb (it is possible to provide an own dialog implementation)



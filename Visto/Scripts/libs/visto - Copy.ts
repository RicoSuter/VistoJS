// Visto JavaScript Framework (VistoJS) v1.3.0
// (c) Rico Suter - http://visto.codeplex.com/
// License: Microsoft Public License (Ms-PL) (https://visto.codeplex.com/license)

/// <reference path="knockout.d.ts" />
/// <reference path="jquery.d.ts" />
/// <reference path="jqueryui.d.ts" />
/// <reference path="visto.extensions.d.ts" />

import hashchange = require("libs/hashchange");
var a = hashchange;

declare function require(module: any, success: (...modules: any[]) => void, failed?: () => void): void;
declare function require(modules: string[], success: (...modules: any[]) => void, failed?: () => void): void;

// ----------------------------
// Declarations
// ----------------------------

// public
export var loadingScreenDelay = 150;
export var isLogging = true;

// variables
export var views: { [a: string]: any } = {};
export var viewCount = 0; // internal
export var navigationCount = 0;  // internal
export var navigationHistory = new Array(); // internal
var loadedViews: { [key: string]: ILoadingView } = <any>([]); // internal
export var isNavigating = false; // internal
export var openedDialogs = 0;

// internationalization variables
export var language = ko.observable(null); // internal
export var supportedLanguages: string[] = []; // internal
export var previousLanguage: string = null; // internal
export var languageStrings: { [a: string]: { [b: string]: { [c: string]: string } } } = <any>([]); // internal

// local variables
var currentContext: any = null;
var currentNavigationPath = "";
var initialBody = $("body").find("div");

// ----------------------------
// Internal helper methods
// ----------------------------

// Logs the string to the console if logging is enabled
function log(value: string) {
    if (isLogging)
        console.log(value);
};

// Tries to load a module using RequireJS
function tryRequire(module: any, completed: (m: any) => void) {
    require(module,
        (result: any) => { completed(result); },
        () => { completed(null); }
        );
};

// Checks whether a string ends with a given suffix
function endsWith(data: string, suffix: string) {
    return data.indexOf(suffix, data.length - suffix.length) !== -1;
};

// Checks whether a string starts with a given prefix
function startsWith(data: string, prefix: string) {
    return data.indexOf(prefix) === 0;
};

// Converts a dashed string ('my-string') into a camel case string (myString)
function convertDashedToCamelCase(data: string) {
    return data.replace(/-([a-z])/g, g => g[1].toUpperCase());
}

// ----------------------------
// Internationalization
// ----------------------------

// Gets the root path string (= path of the package) of the given path object
function getRootPath(path: any) {
    if (path === undefined || path === null)
        return "app";

    if (path.id !== undefined) {
        path = "/" + path.id;

        var index = path.lastIndexOf("/views/");
        if (index === -1)
            index = path.lastIndexOf("/viewModels/");
        if (index === -1)
            index = path.lastIndexOf("/");

        return index === -1 ? "app/" : path.substr(1, index - 1);
    }

    if (path[path.length - 1] !== "/")
        return path;
    return path;
};

// Contains the completion callbacks for language urls
var languageLoadings: { [name: string]: (() => void)[] } = <any>([]);

// Loads a current langauge strings for the given path
function loadLanguageFile(path: any, completed: () => void) {
    path = getRootPath(path);

    var lang = language();
    if (languageStrings[lang] === undefined)
        languageStrings[lang] = <any>([]);

    if (languageStrings[lang][path] === undefined) { // TODO avoid multiple simultaneous loadings
        var url = "scripts/" + path + "/languages/" + lang + ".json";
        if (languageLoadings[url] === undefined) {
            languageLoadings[url] = [completed];
            $.ajax({
                url: url,
                type: "get",
                dataType: "json"
            }).done((result: any) => {
                languageStrings[lang][path] = result;
                $.each(languageLoadings[url],(index, item) => { item(); });
                delete languageLoadings[url];
            }).fail((xhr: any, ajaxOptions: any) => {
                languageStrings[lang][path] = <any>([]);
                $.each(languageLoadings[url],(index, item) => { item(); });
                log("Error loading language JSON '" + url + "': " + ajaxOptions);
                delete languageLoadings[url];
            });
        } else
            languageLoadings[url].push(completed);
    } else
        completed();
};

// Internal method to retrieve a translated string
function getStringEx(lang: string, path: string, key: string, completed?: (...params: string[]) => void) {
    if ($.isArray(key)) {
        var values: any[] = <Array<any>>[];
        for (var i = 0, k: string; k = key[i]; i++)
            values.push(getStringEx(lang, path, k));
        if (completed !== undefined && completed !== null)
            completed.apply(null, values);
        return values[0];
    } else {
        var u = languageStrings[lang];
        var value = languageStrings[lang][path][key];
        if (value === undefined)
            value = path + ":" + key;
        if (completed !== undefined)
            completed(value);
        return value;
    }
};

// Returns a translated string in the current language
export function getString(key: string, path: string, completed?: (...params: string[]) => void) { // internal
    path = getRootPath(path);

    var lang = language();
    if (languageStrings[lang] === undefined)
        languageStrings[lang] = <any>([]);

    if (languageStrings[lang][path] === undefined) {
        loadLanguageFile(path,() => { getStringEx(lang, path, key, completed); });
        if (previousLanguage !== null)
            return getStringEx(previousLanguage, path, key);
        return "";
    } else
        return getStringEx(lang, path, key, completed);
};

// Returns a translated string as observable object which updates when the language changes
export function getStringAsObservable(key: string, path: string) {
    var observable = ko.observable();
    observable(getString(key, path, value => { observable(value); }));
    return observable;
};

// Changes the language in the application
export function setLanguage(lang: string, supportedLangs: string[], updateBindings: boolean) {
    if (language() !== lang) {
        previousLanguage = language();
        language(lang);

        if (supportedLangs !== null && supportedLangs !== undefined)
            supportedLanguages = supportedLangs;

        if (updateBindings === null || updateBindings === undefined || updateBindings)
            replaceLanguageStrings($('body > *'));
    }
};

// Changes the language to the user preferred language
export function setUserLanguage(supportedLangs: string[], updateBindings: boolean) {
    var newLanguage: string;

    if (navigator.userLanguage !== undefined)
        newLanguage = navigator.userLanguage.split("-")[0];
    else
        newLanguage = navigator.language.split("-")[0];

    if ($.inArray(newLanguage, supportedLanguages))
        setLanguage(newLanguage, supportedLangs, updateBindings);
    else
        setLanguage(supportedLangs[0], supportedLangs, updateBindings);
};

// Updates the translated strings of an element
function replaceLanguageStrings(element: JQuery, path?: string) {
    var findRootPath = path === undefined;
    element.find("[data-translate]").each(function () {
        var self = $(this);

        if (findRootPath)
            path = self.attr("data-translate-root");
        else
            self.attr("data-translate-root", path); // used for language refreshes... 

        getString(self.attr("data-translate"), path, content => {
            self.html(content);
        });
    });
};

// ----------------------------
// Custom tags
// ----------------------------

function processCustomTags(data: string) {
    return data.replace(/<vs-([\s\S]+?) ([\s\S]*?)(\/>|>)/g,(match: string, tag: string, attributes: string, close: string) => {
        var path = "";
        var pkg = "";
        var bindings = "";

        attributes.replace(/([\s\S]*?)="([\s\S]*?)"/g,(match: string, name: string, value: string) => {
            name = convertDashedToCamelCase(name.trim());
            if (name === "path")
                path = value;
            else if (name === "package")
                pkg = value;
            else if (startsWith(value, "{") && endsWith(value, "}")) {
                value = value.substr(1, value.length - 2);
                if (value.indexOf("(") > -1)
                    value = "ko.computed(function () { return " + value + "; })";
                bindings += name + ": " + value + ", ";
            }
            else
                bindings += name + ": '" + value + "', ";
            return match;
        });

        var view = convertDashedToCamelCase(tag);
        view = view[0].toUpperCase() + view.substr(1);
        view = path === "" ? view : path + "/" + view;

        bindings += "name: " + (pkg === "" ? "'" + view + "'" : "['" + pkg + "', '" + view + "']");
        return '<div data-bind="view: { ' + bindings + ' }" ' + close;
    });
}

// ----------------------------
// Views
// ----------------------------

// Gets the parent view of the given element
export function getViewFromElement<TView extends VistoViewBase>(element: JQuery): TView;

export function getViewFromElement(element: JQuery): VistoViewBase {
    while (element = element.parent()) {
        if (parent.length === 0)
            return null;
        var viewId: string = $(element[0]).attr("vistoViewId");
        if (viewId !== undefined)
            return views[viewId];
    }
    return null;
};

// Used for custom ko bindings so that they work correctly if they assume that an element is already in the DOM
// Call this in custom ko bindings to run code after element has been added to the DOM
export function addInitializer(completed: () => void) {
    if (currentContext === null) // already in DOM
        completed();
    else
        currentContext.initializers.push(completed);
};

class VistoContext {
    htmls: (() => void)[] = [];
    initializers = new Array();

    rootPackage = "app";
    rootView: VistoViewBase = null;

    parentPackage = "app";
    parentView: VistoViewBase = null;

    restoreQuery: string = undefined;
    viewCount = 0;
    loadedViewCount = 0;

    completed: (rootView: VistoViewBase, rootViewModel: VistoViewModel, restoreQuery: string) => void;

    constructor(completed: (rootView: VistoViewBase, rootViewModel: VistoViewModel, restoreQuery: string) => void) {
        this.completed = completed;
    }

    loaded() {
        var self = this;
        self.loadedViewCount++;
        if (self.loadedViewCount === self.viewCount) { // everything loaded
            $.each(self.htmls.reverse(),(index: number, item: () => void) => { item(); });

            if ($.isFunction(this.completed))
                this.completed(self.rootView,(<any>self.rootView).viewModel, self.restoreQuery);

            $.each(self.initializers,(index: number, item: () => void) => { item(); });
        }
    }
}

// Inserts a view inside an element
function createViewEx(self: JQuery, viewName: any, params: {}, completed: (view: VistoViewBase, viewModel: VistoViewModel, restoreQuery: string) => void) {
    var isRootView = false;
    var context = currentContext;
    var parentView = context != null ? context.parentView : getViewFromElement(self);
    if (context === undefined || context === null) { // from foreach, other late-bindings or root view
        context = new VistoContext(completed);
        completed = null;
        isRootView = true;
    }

    // generate view class id
    var viewPackage = parentView != null ? parentView.viewPackage : context.parentPackage;
    if (viewName.indexOf(":") !== -1)
        viewName = viewName.split(":");
    if ($.isArray(viewName)) {
        viewPackage = getRootPath(viewName[0]);
        viewName = viewName[1];
    }

    var viewClass = viewPackage + ":" + viewName;

    // initialize parameters
    var parameters = new VistoParameters(params);

    var lazySubviewLoading = parameters.getValue("lazySubviewLoading", false);
    if (!lazySubviewLoading)
        context.viewCount++;

    var requirementsLoaded = (viewModule: any, viewModelModule: any) => {
        // initialize view and view model and apply bindings
        var htmlLoaded = (data: string) => {
            var viewId = "view_" + ++viewCount;
            var view: VistoViewBase = <any>{};
            var viewModel: VistoViewModel = <any>{};

            data =
            "<!-- ko stopBinding -->" +
            data.replace(/vId/g, viewId) +
            "<!-- /ko -->";

            var container = $(document.createElement("div"));
            container.html(data);

            var element = container.children()[0];
            self.attr("vistoViewId", viewId);

            if (language() !== null)
                replaceLanguageStrings($(element), viewPackage);

            var hasView = viewModule !== undefined && viewModule !== null;
            var hasViewModel = viewModelModule !== undefined && viewModelModule !== null;

            var className = viewName;
            var index = className.lastIndexOf("/");
            if (index !== -1)
                className = className.substr(index + 1);

            if (hasView)
                eval("var view = new viewModule." + className + "()");
            else
                view = new VistoView();

            if (hasViewModel)
                eval("var viewModel = new viewModelModule." + className + "Model()");
            else
                viewModel = new VistoViewModel();

            viewModel.parameters = parameters;

            view.element = self;
            view.viewId = viewId;
            view.viewName = viewName;
            view.viewClass = viewClass;
            view.viewPackage = viewPackage;
            view.parameters = parameters;
            (<any>view).viewModel = viewModel;

            // TODO rename to avoid overwritings / misuse
            view.parentView = parentView; // internal
            view.subViews = []; // internal
            view.isDestroyed = false; // internal
            view.disposables = []; // internal

            viewModel.view = view;
            views[viewId] = view;

            var restoreQuery: any = undefined;
            restoreQuery = view.initialize(parameters);
            restoreQuery = viewModel.initialize(parameters);

            if (isRootView)
                context.restoreQuery = restoreQuery;

            var setHtmlFunction = () => { self.html(<any>element); };
            var initializeFunction = () => {
                if (hasView && $.isFunction(view.loaded))
                    view.loaded();
                if (hasViewModel && $.isFunction(viewModel.loaded))
                    viewModel.loaded();
            };

            if (lazySubviewLoading) {
                setHtmlFunction();
                ko.applyBindings(viewModel, element);
                initializeFunction();
            } else {
                context.htmls.push(setHtmlFunction);
                context.initializers.push(initializeFunction);

                if (isRootView) {
                    context.rootView = view;
                    context.rootPackage = viewPackage;
                }

                context.parentView = view;
                context.parentPackage = viewPackage;

                currentContext = context;
                if (restoreQuery !== false) // not needed if false => will navigate back immediately
                    ko.applyBindings(viewModel, element);
                currentContext = null;
                context.loaded();
            }

            if ($.isFunction(completed))
                completed(view, viewModel, restoreQuery);
        };

        // load view HTML
        if (loadedViews[viewClass] !== undefined) {
            if (loadedViews[viewClass].running) { // same view already loading
                log("Loading view from server [redundant call]: " + viewClass);
                loadedViews[viewClass].callbacks.push(htmlLoaded);
            } else { // view already loaded
                log("Loading view from cache: " + viewClass);
                htmlLoaded(loadedViews[viewClass].data);
            }
        } else { // load view
            loadedViews[viewClass] = {
                data: null,
                running: true,
                callbacks: [htmlLoaded]
            };

            log("Loading view from server: " + viewClass);

            $.ajax({
                url: "scripts/" + viewPackage + "/views/" + viewName + ".html",
                dataType: "html"
            }).done((data: string) => {
                data = processCustomTags(data);
                loadedViews[viewClass].data = data;
                loadedViews[viewClass].running = false;
                $.each(loadedViews[viewClass].callbacks,(index, item) => {
                    item(data);
                });
            }).fail(() => {
                var data = "<div>[View '" + viewClass + "' not found]</div>";
                loadedViews[viewClass].data = data;
                loadedViews[viewClass].running = false;
                $.each(loadedViews[viewClass].callbacks,(index, item) => {
                    item(data);
                });
            });
        }
    };

    // parallelize the loading of required documents
    var vm: any, vmm: any, count = 3;
    var callback = () => {
        count--;
        if (count === 0)
            requirementsLoaded(vm, vmm);
    };

    tryRequire([viewPackage + "/views/" + viewName],(m: any) => { vm = m; callback(); });
    tryRequire([viewPackage + "/viewModels/" + viewName + "Model"],(m: any) => { vmm = m; callback(); });
    loadLanguageFile(viewPackage,() => { callback(); });
};

// ----------------------------
// Page stack handling
// ----------------------------

// Export the restorePages function
export function restorePages(viewName: string, params?: {}, completed?: any) {
    (<any>$("body")).restorePages(viewName, params, completed);
};

// Navigates to a given page
export function navigateTo(viewName: string, params?: {}, completed?: any) {
    (<any>$("body")).navigateTo(viewName, params, completed);
};

// Gets the current page
export function currentPage() {
    return (<any>$("body")).currentPage();
};

var backNavigationCompleted: any = null;

// Navigates to the previous page
export function navigateBack(completed?: any) {
    if (isNavigating) {
        if ($.isFunction(completed))
            completed(false);
    } else {
        backNavigationCompleted = $.isFunction(completed) ? completed : null;
        history.go(-1);
    }
};

// Navigates back to the home page (first page in stack)
export function navigateHome(completed: (successful: boolean) => void) {
    if (navigationCount <= 1) {
        if ($.isFunction(completed))
            completed(true);
    } else {
        navigateBack((successful: boolean) => {
            if (successful)
                navigateHome(completed);
            else if ($.isFunction(completed))
                completed(false);
        });
    }
};

function tryNavigateBack(navigate: boolean, currentPage: IPageStackDescription, pageStack: IPageStackDescription[]) {
    if (navigate) {
        navigationHistory.pop();
        navigationCount--;

        var previousPage = pageStack[pageStack.length - 2];
        currentPage.view.destroyView();

        pageStack.pop();

        currentPage.element.remove();
        previousPage.element.css("visibility", "visible");
        previousPage.element.css("position", "");

        log("Navigated back to " + previousPage.view.viewClass + ", page stack size: " + pageStack.length);

        if ($.isFunction(previousPage.view.onNavigatedTo))
            previousPage.view.onNavigatedTo("back");
        if ($.isFunction(currentPage.view.onNavigatedFrom))
            currentPage.view.onNavigatedFrom("back");
    }
    else
        (<any>window).location = "#" + currentPage.hash;

    isNavigating = false;

    var copy = backNavigationCompleted;
    backNavigationCompleted = null;
    if ($.isFunction(copy))
        copy(navigate);
};

// Register callback when user manually navigates back (back key)
(<any>$(window)).hashchange(() => {
    if (isNavigating)
        return;

    if (navigationHistory.length > 1) {
        var element = $(navigationHistory[navigationHistory.length - 1]);
        var pageStack = element.data("pageStack");
        if (pageStack.length > 1) {
            var currentPage = pageStack[pageStack.length - 1];
            if (currentPage !== null && currentPage !== undefined) {
                var count = 0, pos = 0;
                while ((pos = window.location.hash.indexOf("/", pos + 1)) !== -1)
                    count++;

                if (currentPage.hash !== count) {
                    currentNavigationPath = currentNavigationPath.substring(0, currentNavigationPath.lastIndexOf("/"));
                    isNavigating = true;
                    if (openedDialogs > 0)
                        tryNavigateBack(false, currentPage, pageStack);
                    else {
                        if ($.isFunction(currentPage.view.onNavigatingFrom))
                            currentPage.view.onNavigatingFrom("back",(navigate: boolean) => { tryNavigateBack(navigate, currentPage, pageStack); });
                        else
                            tryNavigateBack(true, currentPage, pageStack);
                    }
                }
            }
        }
    }
});

// ----------------------------
// Dialogs
// ----------------------------

// Shows a dialog
export function dialog(viewName: any, parameters: {}, dialogOptions: any, closed?: () => void, completed?: (view: VistoDialog<VistoViewModel>, viewModel: VistoViewModel) => void) {
    var dialog = $("<div />");
    $('body').append(dialog);

    (<any>dialog).view(viewName, parameters,(view: VistoDialog<VistoViewModel>, viewModel: VistoViewModel) => {
        if (dialogOptions === undefined || dialogOptions === null)
            dialogOptions = {};

        if ($.isFunction(view.initializeDialog))
            view.initializeDialog(dialogOptions);

        //if ($.isFunction(viewModel.initializeDialog))
        //    viewModel.initializeDialog(dialogOptions);

        openedDialogs++;

        // remove focus from element of the underlying on page 
        // (used in IE to avoid click events on enter press)
        var focusable = $("a,frame,iframe,label,input,select,textarea,button:first");
        if (focusable != null) {
            focusable.focus();
            focusable.blur();
        }

        dialogOptions.zIndex = 99999;
        dialog.dialog(dialogOptions);

        dialog.bind('dialogclose', function () {
            view.destroyView();
            dialog.dialog("destroy");
            openedDialogs--;

            if (closed !== null && closed !== undefined)
                closed();

            dialog.remove();
        });

        view.dialog = dialog;
        if ($.isFunction(completed))
            completed(view, viewModel);
    });
};

// ----------------------------
// KnockoutJS extensions
// ----------------------------

// Handler to define areas where a view model should not evaluate bindings
(<any>ko).bindingHandlers.stopBinding = {
    init() {
        return { controlsDescendantBindings: true };
    }
};

(<any>ko).virtualElements.allowedBindings.stopBinding = true;

// Handler to instantiate views directly in HTML (e.g. <span data-bind="view: { name: ... }" />)
(<any>ko).bindingHandlers.view = {
    init(element: Element, valueAccessor: any) {
        var rootView: VistoViewBase = null;
        if (currentContext !== null)
            rootView = currentContext.rootView;

        var value = <{ [key: string]: any }>ko.utils.unwrapObservable(valueAccessor());
        createViewEx($(element),(<any>value).name, value, view => {
            ko.utils.domNodeDisposal.addDisposeCallback(element,() => { view.destroyView(); });
            if (rootView !== null)
                rootView.subViews.push(view);
        });
    }
};

// ----------------------------
// JQuery extensions
// ----------------------------

// Inserts a view inside an element (JQuery)
(<any>$).fn.view = function (viewName: any, parameters: { [key: string]: any }, completed: (view: VistoViewBase, viewModel: VistoViewModel, restoreQuery: string) => void) {
    var self = this;
    createViewEx(self, viewName, parameters, completed);
    return self;
};

// Restores the page stack using the current query hash 
(<any>$).fn.restorePages = function (viewName: string, parameters: VistoParameters, completed: (view: VistoViewBase, restoreQuery: string) => void) {
    var self = this;
    var array = window.location.hash.split("/");
    if (array.length > 1) {
        $(self).html("");
        showLoading();
        var index = 1;
        var navigateTo = (view: VistoViewBase, restoreQuery: any) => {
            var item = array[index];
            if (item != null) {
                var components = item.split(":");
                var viewPackage = decodeURIComponent(components[0]);
                viewName = decodeURIComponent(components[1]);
                restoreQuery = components.length === 3 ?
                    decodeURIComponent(components[2]) : undefined;

                index++;
                (<any>$(this)).navigateTo(viewPackage + ":" + viewName, { restoreQuery: restoreQuery },(view: VistoViewBase, restoreQuery: any) => {
                    if (restoreQuery === false) {
                        navigateBack();
                        $(this).show();
                    } else
                        navigateTo(view, restoreQuery);
                });
            } else {
                hideLoading();
                if ($.isFunction(completed))
                    completed(view, restoreQuery);
            }
        };
        navigateTo(null, false);
    } else
        (<any>$(self)).navigateTo(viewName, parameters, completed);
};

// Gets the current page (JQuery)
$.fn.currentPage = function () {
    var self = this;
    var pageStack = $(self).data("pageStack");
    if (pageStack === null || pageStack === undefined)
        return null;
    var view = pageStack[pageStack.length - 1].view;
    return view;
};

// Navigates to a page (JQuery)
$.fn.navigateTo = function (viewName: string, parameters: VistoParameters, completed: (view: VistoViewBase, restoreQuery: string) => void) {
    var self = this;

    if (isNavigating) {
        if ($.isFunction(completed))
            completed(null, null);
        return self;
    }
    isNavigating = true;

    var pageStack = $(self).data("pageStack");
    if (pageStack === null || pageStack === undefined) {
        pageStack = new Array();
        $(self).data("pageStack", pageStack);
    }

    var hash = ++navigationCount;

    // append new invisible page to DOM
    var pageContainer = $(document.createElement("div"));
    pageContainer.css("visibility", "hidden");
    pageContainer.css("position", "absolute");
    self.append(pageContainer);

    // load currently visible page
    var currentPage: IPageStackDescription = null;
    if (pageStack.length > 0)
        currentPage = pageStack[pageStack.length - 1];

    var tryNavigateForward = (navigate: boolean) => {
        if (navigate) {
            (<any>pageContainer).view(viewName, parameters,(view: VistoViewBase, viewModel: VistoViewModel, restoreQuery: string) => {
                currentNavigationPath = currentNavigationPath + "/"
                + encodeURIComponent(view.viewPackage) + ":"
                + encodeURIComponent(view.viewName)
                + (restoreQuery !== undefined && restoreQuery !== null ? (":" + encodeURIComponent(restoreQuery)) : "");
                (<any>window).location = "#" + currentNavigationPath;

                navigationHistory.push(this);

                // hide loader or current page
                if (currentPage === null) { // loader view is visible, no page loaded yet
                    initialBody.remove();
                } else {
                    currentPage.element.css("visibility", "hidden");
                    currentPage.element.css("position", "absolute");
                }

                // show next page by removing hiding css styles
                pageContainer.removeAttr("style");

                pageStack.push(<IPageStackDescription>{
                    view: view,
                    hash: hash,
                    element: pageContainer
                });

                log("Navigated to new page " + view.viewClass + ", page stack size: " + pageStack.length);

                if ($.isFunction(view.onNavigatedTo))
                    view.onNavigatedTo("forward");
                if (currentPage !== null && $.isFunction(currentPage.view.onNavigatedFrom))
                    currentPage.view.onNavigatedFrom("forward");

                isNavigating = false;
                if ($.isFunction(completed))
                    completed(view, restoreQuery);
            });
        } else {
            if ($.isFunction(completed))
                completed(null, null);
        }
    };

    if (currentPage !== null && currentPage !== undefined && $.isFunction(currentPage.view.onNavigatingFrom))
        currentPage.view.onNavigatingFrom("forward", tryNavigateForward);
    else
        tryNavigateForward(true);
    return self;
};

interface IPageStackDescription {
    view: VistoViewBase;
    hash: number;
    element: JQuery;
}

interface ILoadingView {
    data: string;
    running: boolean;
    callbacks: ((data: string) => void)[];
}

// ----------------------------
// TypeScript classes
// ----------------------------

export class VistoParameters {
    private parameters: { [key: string]: any };

    constructor(parameters: {}) {
        if (parameters === undefined || parameters === null)
            this.parameters = <any>({});
        else
            this.parameters = <any>(parameters);
    }

    setValue<T>(key: string, value: T) {
        if ($.isFunction(this.parameters[key]))
            this.parameters[key](value);
        else
            this.parameters[key] = value;
    }

    getObservable<T>(key: string, defaultValue?: T): KnockoutObservable<T> {
        if (this.parameters[key] === undefined)
            this.parameters[key] = ko.observable(defaultValue);
        else if ($.isFunction(this.parameters[key]))
            return this.parameters[key];
        else
            this.parameters[key] = ko.observable(this.parameters[key]);
        return this.parameters[key];
    }

    getObservableArray<T>(key: string, defaultValue?: T[]): KnockoutObservableArray<T> {
        if (this.parameters[key] === undefined)
            this.parameters[key] = ko.observableArray(defaultValue);
        else if ($.isFunction(this.parameters[key]))
            return this.parameters[key];
        else
            this.parameters[key] = ko.observableArray(this.parameters[key]);
        return this.parameters[key];
    }

    getValue<T>(key: string, defaultValue?: T): T {
        if (this.parameters[key] === undefined) {
            this.parameters[key] = defaultValue;
            return defaultValue;
        } else if ($.isFunction(this.parameters[key]))
            return this.parameters[key]();
        return this.parameters[key];
    }

    hasValue(key: string) {
        return this.parameters[key] !== undefined;
    }

    isPageRestore() {
        return this.parameters["restoreQuery"] !== undefined;
    }
}

export class VistoViewModel {
    view: VistoViewBase;
    parameters: VistoParameters;

    subscribe<T>(subscribable: KnockoutSubscribable<T>, callback: (newValue: T) => void) {
        this.view.subscribe(subscribable, callback);
    }

    getString(key: string) {
        return this.view.getString(key);
    }

    // event methods

    loaded() {
        // must be empty
    }

    initialize(parameters: VistoParameters): any {
        return ""; // must be empty
    }

    destroy() {
        // must be empty
    }

}

export interface IDisposable {
    dispose(): void;
}

export class VistoViewBase {
    element: JQuery;

    viewId: string;
    viewName: string;
    viewClass: string;
    viewPackage: string;
    parameters: VistoParameters;
    
    // TODO: private
    isDestroyed = false;
    parentView: VistoViewBase;
    subViews: VistoViewBase[] = [];
    disposables: IDisposable[] = [];

    subscribe<T>(subscribable: KnockoutSubscribable<T>, callback: (newValue: T) => void) {
        var subscription = subscribable.subscribe(callback);
        this.disposables.push(subscription);
        return subscription;
    }

    getString(key: string) {
        return getString(key, this.viewPackage);
    }

    getElement(name: string) {
        if (name[0] === "#")
            return $(name[0] + this.viewId + "_" + name.substring(1));
        return $(name);
    }

    getDomElementById(name: string) {
        return document.getElementById(this.viewId + "_" + name);
    }

    getViewElement() {
        return $("[vistoViewId='" + this.viewId + "']"); // TODO set like parentView
    }

    getParentView() {
        return this.parentView;
    }

    // event methods

    loaded() {
        // must be empty
    }

    onNavigatedTo(type: string) {
        // must be empty
    }

    onNavigatedFrom(type: string) {
        // must be empty
    }

    onNavigatingFrom(type: string, callback: (navigate: boolean) => void) {
        callback(true);
    }

    initialize(parameters: VistoParameters): any {
        return ""; // must be empty
    }

    destroy() {
        // must be empty
    }

    // Destroys a view by removing it from the view list, calling the needed event handlers and disposing depending objects
    destroyView() {
        $.each(this.subViews,(index: number, view: VistoViewBase) => {
            view.destroyView();
        });

        if (!this.isDestroyed) {
            log("Destroying view '" + this.viewId + "' (" + this.viewClass + ") with " +
                this.subViews.length + " subviews");

            delete views[this.viewId];

            (<any>this).viewModel.destroy();
            this.destroy();

            $.each(this.disposables,(index: number, item: IDisposable) => {
                item.dispose();
            });

            this.isDestroyed = true;
        }
    }
}

export class VistoView<TViewModel extends VistoViewModel> extends VistoViewBase {
    viewModel: TViewModel;
}

export class VistoDialog<TViewModel extends VistoViewModel> extends VistoView<TViewModel> {
    dialog: JQuery;

    initializeDialog(options: any) {
        // must be empty
    }
}

// ----------------------------
// Loading screen
// ----------------------------

var isLoading = 0;
var loadingElement: JQuery = null;

// Creates the loading screen element
export function createLoadingElement() {
    var element = $(document.createElement("div"));
    element.addClass("ui-widget-overlay ui-front");
    element.html("<div style='text-align: center; color: white'>" +
        "<img src='images/loading.gif' style='border: 0; margin-top: 150px' /></div>");
    return element;
};

// Shows the loading screen
export function showLoading(delayed?: boolean) {
    if (isLoading === 0) {
        if (delayed == undefined || delayed === true) {
            setTimeout(() => {
                if (isLoading > 0) {
                    loadingElement = createLoadingElement();
                    $("body").append(loadingElement);
                }
            }, loadingScreenDelay);
        } else {
            loadingElement = createLoadingElement();
            $("body").append(loadingElement);
        }
    }
    isLoading++;
};

// Hides the loading screen
export function hideLoading() {
    isLoading--;
    if (isLoading === 0) {
        if (loadingElement !== null) {
            loadingElement.remove();
            loadingElement = null;
        }
    }
};
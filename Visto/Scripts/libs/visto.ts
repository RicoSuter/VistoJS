// Visto JavaScript Framework (VistoJS) v2.0.0
// (c) Rico Suter - http://visto.codeplex.com/
// License: Microsoft Public License (Ms-PL) (https://visto.codeplex.com/license)

/// <reference path="knockout.d.ts" />
/// <reference path="jquery.d.ts" />
/// <reference path="jqueryui.d.ts" />
/// <reference path="visto.extensions.d.ts" />
/// <reference path="visto.modules.d.ts" />

declare function require(module: any, success: (...modules: any[]) => void, failed?: () => void): void;
declare function require(modules: string[], success: (...modules: any[]) => void, failed?: () => void): void;

export import __hashchange = require("libs/hashchange");

// ----------------------------
// Constants
// ----------------------------

var viewIdAttribute = "visto-view-id";
var pageStackAttribute = "page-stack";
var lazySubviewLoadingOption = "lazySubviewLoading";
var defaultPackage = "app";
var isPageParameter = "__isPage";

// ----------------------------
// Declarations
// ----------------------------

// public
export var loadingScreenDelay = 300;
export var isLogging = true;

// variables
var views: { [a: string]: ViewBase } = {};
var viewCount = 0;
var navigationCount = 0;
var navigationHistory = new Array();
var loadedViews: { [key: string]: ILoadingView } = <any>([]);
var isNavigating = false;
var openedDialogs = 0;

var defaultCommands = {
    navigateBack() { navigateBack(); }
}

// internationalization variables
export var language = ko.observable(null);
export var supportedLanguages: string[] = [];
var previousLanguage: string = null;
var languageStrings: { [language: string]: { [path: string]: { [key: string]: string } } } = <any>([]); 

// local variables
var currentNavigationPath = "";
var currentContext: ViewContext = null;
var initialBody = $("body").find("div");

// ----------------------------
// Initializer
// ----------------------------

/**
 * Initializes the framework and navigates to the first page or restores the pages. 
 */
export function initialize(options: IVistoOptions) {
    defaultPackage = options.defaultPackage === undefined ? defaultPackage : options.defaultPackage;  
    setUserLanguage(options.supportedLanguages);

    if (options.registerEnterKeyFix === undefined || options.registerEnterKeyFix) {
        $(document).bind("keypress", ev => {
            if (ev.keyCode === 13 && (<any>ev.target).localName === "input")
                ev.preventDefault();
        });
    }

    restorePages(options.defaultView); 
}

export interface IVistoOptions {
    defaultView: string; 
    defaultPackage: string;
    supportedLanguages: string[]; 
    registerEnterKeyFix: boolean; 
}

// ----------------------------
// Internal helper methods
// ----------------------------

// Logs the string to the console if logging is enabled
function log(value: string) {
    if (isLogging)
        console.log(value);
};

// Tries to load a module using RequireJS
function tryRequire(moduleNames: any, completed: (m: any) => void) {
    require(moduleNames,(result: any) => { completed(result); },() => { completed(null); });
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

// Contains the completion callbacks for language urls
var languageLoadings: { [name: string]: (() => void)[] } = <any>([]);

/**
 * Gets the package name of the given path. 
 */
function getPackageName(path: string) {
    if (path === undefined || path === null)
        return defaultPackage;
    if (path[path.length - 1] !== "/")
        return path;
    return path;
};

/**
 * Gets the package name where the given module is located. 
 */
export function getPackageNameForModule(packageModule: IModule) {
    var modulePath = "/" + packageModule.id;

    var index = modulePath.lastIndexOf("/views/");
    if (index === -1)
        index = modulePath.lastIndexOf("/viewModels/");
    if (index === -1)
        index = modulePath.lastIndexOf("/");

    return index === -1 ? defaultPackage : modulePath.substr(1, index - 1);
}

/**
 * Gets the full view name for the view from the given module and path. 
 */
export function getViewName(packageModule: IModule, viewPath: string) {
    return getPackageNameForModule(packageModule) + ":" + viewPath;
}

/**
 * Loads the language file for the given package and current language.
 */
function loadLanguageFile(packageName: string, completed: () => void) {
    var lang = language();
    if (languageStrings[lang] === undefined)
        languageStrings[lang] = <any>([]);

    if (languageStrings[lang][packageName] === undefined) { // TODO avoid multiple simultaneous loadings
        var url = "Scripts/" + packageName + "/languages/" + lang + ".json";
        if (languageLoadings[url] === undefined) {
            languageLoadings[url] = [completed];
            $.ajax({
                url: url,
                type: "get",
                dataType: "json"
            }).done((result: any) => {
                languageStrings[lang][packageName] = result;
                $.each(languageLoadings[url],(index, item) => { item(); });
                delete languageLoadings[url];
            }).fail((xhr: any, ajaxOptions: any) => {
                languageStrings[lang][packageName] = <any>([]);
                $.each(languageLoadings[url],(index, item) => { item(); });
                log("Error loading language JSON '" + url + "': " + ajaxOptions);
                delete languageLoadings[url];
            });
        } else
            languageLoadings[url].push(completed);
    } else
        completed();
};

/**
 * Loads a translated string.
 */
export function getString(key: string, path: string, completed?: (value: string) => void) {
    path = getPackageName(path);

    var lang = language();
    if (languageStrings[lang] === undefined)
        languageStrings[lang] = <any>([]);

    if (languageStrings[lang][path] === undefined) {
        loadLanguageFile(path,() => { getStringForLanguage(lang, path, key, completed); });
        if (previousLanguage !== null)
            return getStringForLanguage(previousLanguage, path, key);
        return "";
    } else
        return getStringForLanguage(lang, path, key, completed);
};

/**
 * Loads a translated string as observable object which updates when the language changes. 
 */
export function getStringAsObservable(key: string, path: string) {
    var observable = ko.observable<string>();
    observable(getString(key, path, value => { observable(value); }));
    return observable;
};

/**
 * Loads a translated string for a given language.
 */
export function getStringForLanguage(lang: string, path: string, key: string, completed?: (...params: string[]) => void) {
    var value = languageStrings[lang][path][key];
    if (value === undefined)
        value = path + ":" + key;
    if (completed !== undefined)
        completed(value);
    return value;
};

/**
 * Sets the language of the application. 
 */
export function setLanguage(lang: string, supportedLangs: string[], updateBindings?: boolean) {
    if (language() !== lang) {
        previousLanguage = language();
        language(lang);

        if (supportedLangs !== null && supportedLangs !== undefined)
            supportedLanguages = supportedLangs;

        if (updateBindings === null || updateBindings === undefined || updateBindings)
            replaceLanguageStrings($('body > *'));
    }
};

/**
 * Sets the language to the user preferred language.
 */
export function setUserLanguage(supportedLangs: string[], updateBindings?: boolean) {
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

/**
 * Updates all translated strings of an HTML element and its children. 
 */
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
// Views
// ----------------------------

/**
 * Gets the parent view of the given element.
 */
export function getViewFromElement(element: JQuery): ViewBase {
    while ((element = element.parent()) != undefined) {
        if (parent.length === 0)
            return null;

        var viewId = $(element[0]).attr(viewIdAttribute);
        if (viewId !== undefined)
            return views[viewId];
    }
    return null;
};

/**
 * Registers an initializer which is called after the elements of the context are added to the DOM. 
 * This is used for custom ko bindings so that they work correctly if they assume that an element is already in the DOM. 
 * Call this in custom ko bindings to run code after element has been added to the DOM. 
 */
export function addInitializer(completed: () => void) {
    if (currentContext === null) // already in DOM
        completed();
    else
        currentContext.initializers.push(completed);
};

// ----------------------------
// Page stack handling
// ----------------------------

/**
 * Restores the page stack on the body element as frame. 
 */
export function restorePages(fullViewName: string, params?: {}, completed?: any) {
    (<any>$("body")).restorePages(fullViewName, params, completed);
};

/**
 * Navigates to a given page using the body element as frame.
 */
export function navigateTo(fullViewName: string, params?: {}, completed?: (view: ViewBase, restoreQuery: string) => void): void;
export function navigateTo(modulePackage: IModule, viewName: string, params?: {}, completed?: (view: ViewBase, restoreQuery: string) => void): void;
export function navigateTo(a: any, b: any, c?: any, d?: any): void {
    if (typeof a === "string")
        (<any>$("body")).navigateTo(a, b, c);
    else
        (<any>$("body")).navigateTo(getViewName(a, b), c, d);
}

/**
 * Gets the current page. 
 */
export function currentPage() {
    return <ViewBase>(<any>$("body")).currentPage();
};

var backNavigationCompleted: (navigate: boolean) => void = null;

/**
 * Navigates to the previous page.
 */
export function navigateBack(completed?: (navigate: boolean) => void) {
    if (isNavigating) {
        if ($.isFunction(completed))
            completed(false);
    } else {
        backNavigationCompleted = $.isFunction(completed) ? completed : null;
        history.go(-1);
    }
};

function tryNavigateBack(navigate: boolean, currentPage: IPage, pageStack: IPage[]) {
    if (navigate) {
        navigationHistory.pop();
        navigationCount--;

        var previousPage = pageStack[pageStack.length - 2];
        currentPage.view.__destroyView();

        pageStack.pop();

        currentPage.element.remove();
        previousPage.element.css("visibility", "visible");
        previousPage.element.css("position", "");

        log("Navigated back to " + previousPage.view.viewClass + ", page stack size: " + pageStack.length);

        // TODO: Use instance of
        if ($.isFunction(previousPage.view.onNavigatedTo))
            previousPage.view.onNavigatedTo("back");
        if ($.isFunction(currentPage.view.onNavigatedFrom))
            currentPage.view.onNavigatedFrom("back");
    }
    else
        (<any>window).location = "#" + currentPage.hash;

    isNavigating = false;

    if ($.isFunction(backNavigationCompleted))
        backNavigationCompleted(navigate);
    backNavigationCompleted = null;
};

/**
 * Navigates back to the home page (first page in stack).
 */
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

// Register callback when user manually navigates back (back key)
(<any>$(window)).hashchange(() => {
    if (isNavigating)
        return;

    if (navigationHistory.length > 1) {
        var element = $(navigationHistory[navigationHistory.length - 1]);
        var pageStack = getPageStack(element);
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
                        currentPage.view.onNavigatingFrom("back",(navigate: boolean) => {
                            tryNavigateBack(navigate, currentPage, pageStack);
                        });
                    }
                }
            }
        }
    }
});

// ----------------------------
// Dialogs
// ----------------------------

/**
 * Shows a dialog. 
 */
export function dialog(fullViewName: string, parameters: {}, dialogOptions: any, closed?: () => void, completed?: (view: Dialog<ViewModel>, viewModel: ViewModel) => void): void;
export function dialog(modulePackage: IModule, viewName: string, parameters: {}, dialogOptions: any, closed?: () => void, completed?: (view: Dialog<ViewModel>, viewModel: ViewModel) => void): void;
export function dialog(a: any, b: any, c: any, d: any, e?: any, f?: any) {
    if (typeof a === "string")
        showDialog(a, b, c, d, e);
    else
        showDialog(getViewName(a, b), c, d, e, f);
}
function showDialog(fullViewName: string, parameters: {}, dialogOptions: any, closed?: () => void, completed?: (view: Dialog<ViewModel>, viewModel: ViewModel) => void) {
    var dialog = $("<div />");
    $('body').append(dialog);

    (<any>dialog).view(fullViewName, parameters,(view: Dialog<ViewModel>, viewModel: ViewModel) => {
        if (dialogOptions === undefined || dialogOptions === null)
            dialogOptions = {};

        if ($.isFunction(view.initializeDialog))
            view.initializeDialog(dialogOptions);

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

        dialog.bind('dialogclose',() => {
            view.__destroyView();
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
ko.bindingHandlers["stopBinding"] = {
    init() {
        return { controlsDescendantBindings: true };
    }
};

ko.virtualElements.allowedBindings["stopBinding"] = true;

// Handler to instantiate views directly in HTML (e.g. <span data-bind="view: { name: ... }" />)
ko.bindingHandlers["view"] = {
    init(element: Element, valueAccessor: any) {
        var rootView: ViewBase = null;
        if (currentContext !== null)
            rootView = currentContext.rootView;

        var value = <{ [key: string]: any }>ko.utils.unwrapObservable(valueAccessor());

        var loader = new ViewFactory();
        loader.create($(element),(<any>value).name, value, view => {
            ko.utils.domNodeDisposal.addDisposeCallback(element,() => { view.__destroyView(); });
            if (rootView !== null)
                rootView.__addSubView(view);
        });
    }
};

// ----------------------------
// JQuery extensions
// ----------------------------

// Inserts a view inside an element (JQuery)
$.fn.view = function (fullViewName: string, parameters: { [key: string]: any }, completed: (view: ViewBase, viewModel: ViewModel, restoreQuery: string) => void) {
    var loader = new ViewFactory();
    loader.create(this, fullViewName, parameters, completed);
    return this;
};

var isRestoringPages = false; 

// Restores the page stack using the current query hash 
$.fn.restorePages = function (fullViewName: string, parameters: Parameters, completed: (view: ViewBase) => void) {
    var frame = $(this);

    var urlSegments = decodeURIComponent(window.location.hash).split("/");
    if (urlSegments.length > 1) {

        isRestoringPages = true;
        showLoading(false);
        var currentSegmentIndex = 1;

        var navigateTo = (view: ViewBase) => {
            var segment = urlSegments[currentSegmentIndex];
            if (segment != null) {
                var segmentParts = segment.split(":");
                var supportsPageRestore = segmentParts.length === 3; 
                if (supportsPageRestore) {
                    currentSegmentIndex++;
                    var fullViewName = segmentParts[0] + ":" + segmentParts[1];
                    var restoreQuery = segmentParts.length === 3 ? segmentParts[2] : undefined;
                    (<any>frame).navigateTo(fullViewName, { restoreQuery: restoreQuery }, (view: ViewBase) => {
                        navigateTo(view);
                    });
                } else
                    finishPageRestore(frame, view, completed);
            } else
                finishPageRestore(frame, view, completed);
        };
        navigateTo(null);
    } else
        (<any>frame).navigateTo(fullViewName, parameters, completed);
};

function finishPageRestore(frame: JQuery, view: ViewBase, completed: (view: ViewBase) => void) {
    hideLoading();
    isRestoringPages = false;

    var page = getCurrentPage(frame);
    page.element.removeAttr("style");

    if (completed != undefined)
        completed(view);
}

// Gets the current page (JQuery)
$.fn.currentPage = function () {
    var pageStack = getPageStack($(this));
    if (pageStack === null || pageStack === undefined)
        return null;

    return pageStack[pageStack.length - 1].view;
};

// Navigates to a page (JQuery)
$.fn.navigateTo = function (fullViewName: string, parameters: {}, completed: (view: ViewBase, restoreQuery: string) => void) {
    var frame = $(this);

    if (isNavigating) {
        if ($.isFunction(completed))
            completed(null, null);
        return frame;
    }
    isNavigating = true;

    // append new invisible page to DOM
    var pageContainer = $(document.createElement("div"));
    pageContainer.css("visibility", "hidden");
    pageContainer.css("position", "absolute");
    frame.append(pageContainer);

    // load currently visible page
    var currentPage = getCurrentPage($(frame));
    showLoading(currentPage !== null);
    if (currentPage !== null && currentPage !== undefined) {
        currentPage.view.onNavigatingFrom("forward",(navigate) => {
            tryNavigateForward(fullViewName, parameters, frame, pageContainer, navigate,(view: ViewBase, restoreQuery: string) => {
                if (completed !== undefined)
                    completed(view, restoreQuery);
                hideLoading();
            });
        });
    } else {
        tryNavigateForward(fullViewName, parameters, frame, pageContainer, true,(view: ViewBase, restoreQuery: string) => {
            if (completed !== undefined)
                completed(view, restoreQuery);
            hideLoading();
        });
    }
    return frame;
};

function getPageStack(element: JQuery) {
    var pageStack = <IPage[]>element.data(pageStackAttribute);
    if (pageStack === null || pageStack === undefined) {
        pageStack = new Array();
        element.data(pageStackAttribute, pageStack);
    }
    return pageStack;
}

function getCurrentPage(element: JQuery): IPage {
    var pageStack = getPageStack(element);
    if (pageStack.length > 0)
        return pageStack[pageStack.length - 1];
    return null;
}

function tryNavigateForward(fullViewName: string, parameters: any, frame: JQuery, pageContainer: JQuery, navigate: boolean, completed: (view: ViewBase, restoreQuery: string) => void) {
    if (navigate) {
        if (parameters === undefined || parameters == null)
            parameters = {};

        parameters[isPageParameter] = true; 

        (<any>pageContainer).view(fullViewName, parameters,(view: PageBase, viewModel: ViewModel, restoreQuery: string) => {
            currentNavigationPath = currentNavigationPath + "/" + encodeURIComponent(
                view.viewName + (restoreQuery !== undefined && restoreQuery !== null ? (":" + restoreQuery) : ""));

            (<any>window).location = "#" + currentNavigationPath;

            navigationHistory.push(frame);

            // current page
            var currentPage = getCurrentPage(frame);
            if (currentPage !== null && currentPage !== undefined) {
                currentPage.element.css("visibility", "hidden");
                currentPage.element.css("position", "absolute");
            }

            // show next page by removing hiding css styles
            if (!isRestoringPages)
                pageContainer.removeAttr("style");

            var pageStack = getPageStack(frame);
            pageStack.push(<IPage>{
                view: view,
                hash: ++navigationCount,
                element: pageContainer
            });

            log("Navigated to new page " + view.viewClass + ", page stack size: " + pageStack.length);

            view.onNavigatedTo("forward");

            if (currentPage !== null && currentPage !== undefined)
                (<PageBase>currentPage.view).onNavigatedFrom("forward");

            isNavigating = false;
            completed(view, restoreQuery);
        });
    } else
        completed(null, null);
};

// ----------------------------
// Loading screen
// ----------------------------

var loadingCount = 0;
var loadingElement: JQuery = null;

// Creates the loading screen element
export function createLoadingElement() {
    var element = $(document.createElement("div"));
    element.addClass("ui-widget-overlay ui-front");
    element.html("<div style='text-align: center; color: white'>" +
        "<img src='Content/Images/loading.gif' style='border: 0; margin-top: 150px' /></div>");
    return element;
};

// Shows the loading screen
export function showLoading(delayed?: boolean) {
    if (initialBody !== null) {
        initialBody.remove();
        initialBody = null;
    }

    if (loadingCount === 0) {
        if (delayed == undefined || delayed) {
            setTimeout(() => {
                if (loadingCount > 0)
                    appendLoadingElement();
            }, loadingScreenDelay);
        } else
            appendLoadingElement();
    }

    loadingCount++;
    log("show: " + loadingCount);
};

function appendLoadingElement() {
    if (loadingElement === null) {
        loadingElement = createLoadingElement();
        $("body").append(loadingElement);
        log("appended");
    }
}

// Hides the loading screen
export function hideLoading() {
    loadingCount--;
    if (loadingCount === 0) {
        log("hidden1");
        if (loadingElement !== null) {
            loadingElement.remove();
            loadingElement = null;
            log("hidden2");
        }
    }
    log("hide: " + loadingCount);
};

// ----------------------------
// View model
// ----------------------------

export class ViewModel {
    parameters: Parameters;
    defaultCommands = defaultCommands;

    private view: ViewBase;
    __restoreQuery: string = null;

    constructor(view: ViewBase, parameters: Parameters) {
        this.view = view;
        this.parameters = parameters;
    }

    /**
     * Enables page restoring for the current page. 
     * This method must be called in the initialize() method. 
     * Page restore only works for a page if all previous pages in the page stack support page restore.
     */
    enablePageRestore(restoreQuery?: string) {
        this.__restoreQuery = restoreQuery === undefined ? "" : restoreQuery;
    }
    
    /**
     * Subscribes to the given subscribable and stores the subscription automatic clean up. 
     */
    subscribe<T>(subscribable: KnockoutSubscribable<T>, callback: (newValue: T) => void) {
        this.view.subscribe(subscribable, callback);
    }

    /**
     * Loads a translated string.
     */
    getString(key: string) {
        return this.view.getString(key);
    }

    /**
     * [Virtual] Initializes the view before it is added to the DOM.
     */
    initialize(parameters: Parameters) {
        // must be empty
    }

    /**
     * [Virtual] Called when the view has been added to the DOM.
     */
    onLoaded() {
        // must be empty
    }

    /**
     * [Virtual] Called before the view is added to the DOM with the ability to perform async work. 
     * The callback() must be called when the work has been performed.
     */
    onLoading(callback: () => void) {
        callback();
    }

    /**
     * [Virtual] Called to clean up resources when the view has been removed from the DOM. 
     */
    destroy() {
        // must be empty
    }
}

// ----------------------------
// View
// ----------------------------

export class ViewBase {
    viewId: string;
    viewName: string;
    viewClass: string;
    viewPackage: string;

    element: JQuery;
    parameters: Parameters;
    parentView: ViewBase = null;

    private isDestroyed = false;
    private subViews: ViewBase[] = [];
    private disposables: IDisposable[] = [];

    /**
     * Enables page restoring for the current page. 
     * This method must be called in the initialize() method. 
     * Page restore only works for a page if all previous pages in the page stack support page restore.
     */
    enablePageRestore(restoreQuery?: string) {
        (<View<ViewModel>>this).viewModel.enablePageRestore(restoreQuery);
    }
    
    /**
     * Subscribes to the given subscribable and stores the subscription automatic clean up. 
     */
    subscribe<T>(subscribable: KnockoutSubscribable<T>, callback: (newValue: T) => void) {
        var subscription = subscribable.subscribe(callback);
        this.disposables.push(subscription);
        return subscription;
    }

    /**
     * Loads a translated string.
     */
    getString(key: string) {
        return getString(key, this.viewPackage);
    }

    /**
     * Finds an element inside this view. 
     */
    getElement(selector: string) {
        if (selector[0] === "#")
            return this.element.find(selector[0] + this.viewId + "_" + selector.substring(1)); // TODO: How to reference?
        return this.element.find(selector);
    }

    /**
     * Finds an element by ID inside this view. 
     */
    getElementById(id: string) {
        return this.getElement("#" + id); // TODO: How to reference?
    }

    // event methods

    /**
     * [Virtual] Initializes the view before it is added to the DOM.
     */
    initialize(parameters: Parameters) {
        // must be empty
    }
    
    /**
     * [Virtual] Called before the view is added to the DOM with the ability to perform async work. 
     * The callback() must be called when the work has been performed.
     */
    onLoading(callback: () => void) {
        callback();
    }

    /**
     * [Virtual] Called when the view has been added to the DOM.
     */
    onLoaded() {
        // must be empty
    }

    /**
     * [Virtual] Called to clean up resources when the view has been removed from the DOM. 
     */
    destroy() {
        // must be empty
    }

    /**
     * Destroys a view by removing it from the view list, calling the needed event handlers and disposing depending objects. 
     */
    __destroyView() {
        $.each(this.subViews,(index: number, view: ViewBase) => {
            view.__destroyView();
        });

        if (!this.isDestroyed) {
            log("Destroying view '" + this.viewId + "' (" + this.viewClass + ") with " +
                this.subViews.length + " subviews");

            delete views[this.viewId];

            (<View<ViewModel>>this).viewModel.destroy();
            this.destroy();

            $.each(this.disposables,(index: number, item: IDisposable) => {
                item.dispose();
            });

            this.isDestroyed = true;
        }
    }

    // ReSharper disable InconsistentNaming

    __setParentView(parentView: ViewBase) {
        if (this.parentView !== null)
            throw "Parent view has already been set.";
        this.parentView = parentView;
    }

    __addSubView(view: ViewBase) {
        this.subViews.push(view);
    }

    // ReSharper restore InconsistentNaming
}

export class View<TViewModel extends ViewModel> extends ViewBase {
    viewModel: TViewModel;
}

// ----------------------------
// Page
// ----------------------------

export class Page<TViewModel extends ViewModel> extends View<TViewModel> {
    /**
     * [Virtual] Called when navigated to this page. 
     */
    onNavigatedTo(type: string) {
        // must be empty
    }

    /**
     * [Virtual] Called after navigated from this page. 
     */
    onNavigatedFrom(type: string) {
        // must be empty
    }

    /**
     * [Virtual] Called when navigating to this page. 
     * The callback() must be called with a boolean stating whether to navigate or cancel the navigation operation.
     */
    onNavigatingFrom(type: string, callback: (navigate: boolean) => void) {
        callback(true);
    }
}

export class PageBase extends Page<ViewModel> {

}

// ----------------------------
// Dialog
// ----------------------------

export class Dialog<TViewModel extends ViewModel> extends View<TViewModel> {
    dialog: JQuery;

    initializeDialog(options: any) {
        // must be empty
    }
}

// ----------------------------
// Parameters
// ----------------------------

export class Parameters {
    private parameters: { [key: string]: any };

    constructor(parameters: {}) {
        if (parameters === undefined || parameters === null)
            this.parameters = <any>({});
        else
            this.parameters = <any>(parameters);
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

    /**
     * Sets a value either writing back through a binding or directly on the parameters object. 
     */
    setValue<T>(key: string, value: T) {
        if ($.isFunction(this.parameters[key]))
            this.parameters[key](value);
        else
            this.parameters[key] = value;
    }

    hasValue(key: string) {
        return this.parameters[key] !== undefined;
    }

    isPageRestore() {
        return this.getRestoreQuery() !== undefined;
    }

    getRestoreQuery() {
        return this.parameters["restoreQuery"];
    }
}

// ----------------------------
// View factory
// ----------------------------

class ViewFactory {
    element: JQuery;
    parameters: Parameters;

    viewId: string;
    viewModule: any;
    viewModelModule: any;
    viewLocator: ViewLocator;

    isRootView: boolean;
    context: ViewContext;

    parentView: ViewBase;

    view: ViewBase;
    viewModel: ViewModel;

    rootElement: HTMLElement;

    completed: (view: ViewBase, viewModel: ViewModel, restoreQuery: string) => void;

    /**
     * Creates a view for the given element.
     */
    create(element: JQuery, fullViewName: string, params: {}, completed: (view: ViewBase, viewModel: ViewModel, restoreQuery: string) => void) {
        this.element = element;

        if (currentContext === undefined || currentContext === null) {
            // from foreach, other late-bindings or root view
            this.context = new ViewContext(completed);
            this.parentView = getViewFromElement(element);
            this.completed = null;
            this.isRootView = true;
        } else {
            this.context = currentContext;
            this.parentView = currentContext.parentView;
            this.completed = completed;
            this.isRootView = false;
        }

        this.viewLocator = new ViewLocator(fullViewName, this.context, this.parentView);
        this.parameters = new Parameters(params);

        var lazySubviewLoading = this.parameters.getValue(lazySubviewLoadingOption, false);
        if (!lazySubviewLoading)
            this.context.viewCount++;

        this.loadScriptsAndLanguageFile();
    }

    private loadScriptsAndLanguageFile() {
        var count = 3;

        tryRequire([this.viewLocator.package + "/views/" + this.viewLocator.view],(m: any) => {
            this.viewModule = m;
            if ((--count) === 0)
                this.loadHtml();
        });

        tryRequire([this.viewLocator.package + "/viewModels/" + this.viewLocator.view + "Model"],(m: any) => {
            this.viewModelModule = m;
            if ((--count) === 0)
                this.loadHtml();
        });

        loadLanguageFile(this.viewLocator.package,() => {
            if ((--count) === 0)
                this.loadHtml();
        });
    }

    private loadHtml() {
        var isLoadingOrLoaded = loadedViews[this.viewLocator.name] !== undefined;
        if (isLoadingOrLoaded) {
            var isLoading = loadedViews[this.viewLocator.name].running;
            if (isLoading) {
                log("Loading view from server [redundant call]: " + this.viewLocator.name);
                loadedViews[this.viewLocator.name].callbacks.push((data) => this.htmlLoaded(data));
            } else {
                log("Loading view from cache: " + this.viewLocator.name);
                this.htmlLoaded(loadedViews[this.viewLocator.name].data);
            }
        } else {
            loadedViews[this.viewLocator.name] = {
                data: null,
                running: true,
                callbacks: [(data) => this.htmlLoaded(data)]
            };

            log("Loading view from server: " + this.viewLocator.name);

            $.ajax({
                url: "Scripts/" + this.viewLocator.package + "/views/" + this.viewLocator.view + ".html",
                dataType: "html"
            }).done((data: string) => {
                data = this.processCustomTags(data);
                loadedViews[this.viewLocator.name].data = data;
                loadedViews[this.viewLocator.name].running = false;
                $.each(loadedViews[this.viewLocator.name].callbacks,(index, item) => {
                    item(data);
                });
            }).fail(() => {
                var data = "<div>[View '" + this.viewLocator.name + "' not found]</div>";
                loadedViews[this.viewLocator.name].data = data;
                loadedViews[this.viewLocator.name].running = false;
                $.each(loadedViews[this.viewLocator.name].callbacks,(index, item) => {
                    item(data);
                });
            });
        }
    }

    private htmlLoaded(htmlData: string) {
        this.viewId = "view_" + ++viewCount;

        htmlData =
        "<!-- ko stopBinding -->" +
        htmlData.replace(/vId/g, this.viewId) +
        "<!-- /ko -->";

        var container = $(document.createElement("div"));
        container.html(htmlData);

        this.rootElement = container.children()[0];
        this.element.attr(viewIdAttribute, this.viewId);

        if (language() !== null)
            replaceLanguageStrings($(this.rootElement), this.viewLocator.package);

        this.view = this.instantiateView();
        this.viewModel = this.instantiateViewModel(this.view);

        // initialize and retrieve restore query
        this.view.initialize(this.parameters);
        this.viewModel.initialize(this.parameters);
        var restoreQuery = this.parameters.isPageRestore() ? this.parameters.getRestoreQuery() : this.viewModel.__restoreQuery;

        if (this.isRootView)
            this.context.restoreQuery = restoreQuery;

        var lazySubviewLoading = this.parameters.getValue(lazySubviewLoadingOption, false);
        if (lazySubviewLoading) {
            this.__setHtml();
            ko.applyBindings(this.viewModel, this.rootElement);
            this.__raiseLoadedEvents();
        } else {
            this.context.factories.push(this);

            if (this.isRootView) {
                this.context.rootView = this.view;
                this.context.rootPackage = this.viewLocator.package;
            }

            this.context.parentView = this.view;
            this.context.parentPackage = this.viewLocator.package;

            currentContext = this.context;
            ko.applyBindings(this.viewModel, this.rootElement);
            currentContext = null;

            this.context.loaded();
        }

        if ($.isFunction(this.completed))
            this.completed(this.view, this.viewModel, restoreQuery);
    }

    private instantiateView() {
        var view: ViewBase;

        var hasView = this.viewModule !== undefined && this.viewModule !== null;
        if (hasView)
            view = <ViewBase>(new this.viewModule[this.viewLocator.className]());
        else
            view = this.parameters.getValue(isPageParameter) ? new Page() : new View();

        view.element = this.element;
        view.viewId = this.viewId;

        view.viewName = this.viewLocator.name;
        view.viewClass = this.viewLocator.className;
        view.viewPackage = this.viewLocator.package;

        view.parameters = this.parameters;
        view.__setParentView(this.parentView);

        views[this.viewId] = view;

        return view;
    }

    private instantiateViewModel(view: ViewBase) {
        var viewModel: ViewModel;

        var hasViewModel = this.viewModelModule !== undefined && this.viewModelModule !== null;
        if (hasViewModel)
            viewModel = <ViewModel>(new this.viewModelModule[this.viewLocator.className + "Model"](view, this.parameters));
        else
            viewModel = new ViewModel(view, this.parameters);

        (<any>view).viewModel = viewModel;

        return viewModel;
    }

    /**
     * Processes the custom tags in the given HTML data string.
     */
    private processCustomTags(data: string) {
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

            bindings += "name: " + (pkg === "" ? "'" + view + "'" : "'" + pkg + ":" + view + "'");
            return '<div data-bind="view: { ' + bindings + ' }" ' + close;
        });
    }

    // ReSharper disable InconsistentNaming

    __raiseLoadedEvents() {
        this.view.onLoaded();
        this.viewModel.onLoaded();
    }

    __setHtml() {
        this.element.html(<any>this.rootElement);
    }

    // ReSharper restore InconsistentNaming
}

class ViewContext {
    factories: ViewFactory[] = [];
    initializers: (() => void)[] = [];

    rootPackage = defaultPackage;
    rootView: ViewBase = null;

    parentPackage = defaultPackage;
    parentView: ViewBase = null;

    viewCount = 0;
    restoreQuery: string = undefined;
    loadedViewCount = 0;

    completed: (rootView: ViewBase, rootViewModel: ViewModel, restoreQuery: string) => void;

    constructor(completed: (rootView: ViewBase, rootViewModel: ViewModel, restoreQuery: string) => void) {
        this.completed = completed;
    }

    loaded() {
        this.loadedViewCount++;
        if (this.loadedViewCount === this.viewCount) {
            this.loadedViewCount = 0;
            $.each(this.factories,(index: number, context: ViewFactory) => {
                context.view.onLoading(() => {
                    this.loadedViewCount++;
                    if (this.loadedViewCount === this.viewCount) {
                        this.loadedViewCount = 0;
                        $.each(this.factories,(index: number, context: ViewFactory) => {
                            context.viewModel.onLoading(() => {
                                this.loadedViewCount++;
                                if (this.loadedViewCount === this.viewCount) {
                                    $.each(this.factories.reverse(),(index: number, factory: ViewFactory) => {
                                        factory.__setHtml();
                                    });

                                    if ($.isFunction(this.completed))
                                        this.completed(this.rootView,(<any>this.rootView).viewModel, this.restoreQuery);

                                    $.each(this.factories,(index: number, factory: ViewFactory) => {
                                        factory.__raiseLoadedEvents();
                                    });

                                    $.each(this.initializers,(index: number, initializer: () => void) => {
                                        initializer();
                                    });
                                }
                            });
                        });
                    }
                });
            });
        }
    }
}

class ViewLocator {
    package: string;
    view: string;
    name: string;
    className: string;

    constructor(fullViewName: string, context: ViewContext, parentView: ViewBase) {
        if (fullViewName.indexOf(":") !== -1) {
            var arr = fullViewName.split(":");
            this.package = getPackageName(arr[0]);
            this.view = arr[1];
        } else {
            this.package = parentView != null ? parentView.viewPackage : context.parentPackage;
            this.view = fullViewName;
        }

        this.name = this.package + ":" + this.view;

        var index = this.view.lastIndexOf("/");
        if (index !== -1)
            this.className = this.view.substr(index + 1);
        else
            this.className = this.view;
    }
}

// ----------------------------
// Interfaces
// ----------------------------

export interface IModule {
    id: string;
    uri: string;
}

interface IPage {
    view: PageBase;
    hash: number;
    element: JQuery;
}

interface ILoadingView {
    data: string;
    running: boolean;
    callbacks: ((data: string) => void)[];
}

export interface IDisposable {
    dispose(): void;
}

export interface IVisto {
    navigateBack(completed?: (navigate: boolean) => void): void;
}
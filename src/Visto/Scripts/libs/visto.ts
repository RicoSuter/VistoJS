// Visto JavaScript Framework (VistoJS) v2.1.2
// (c) Rico Suter - http://visto.codeplex.com/
// License: Microsoft Public License (Ms-PL) (https://visto.codeplex.com/license)

/// <reference path="q.d.ts" />
/// <reference path="knockout.d.ts" />
/// <reference path="jquery.d.ts" />
/// <reference path="visto.modules.d.ts" />

declare function require(module: any, success: (...modules: any[]) => void, failed?: () => void): void;
declare function require(modules: string[], success: (...modules: any[]) => void, failed?: () => void): void;

export import __hashchange = require("libs/hashchange");

// ----------------------------
// Constants
// ----------------------------

var viewIdAttribute = "visto-view-id";
var pageStackAttribute = "page-stack";
var lazyViewLoadingOption = "lazyLoading";
var defaultPackage = "app";
var isPageParameter = "__isPage";
var isDialogParameter = "__isDialog";

// ----------------------------
// Declarations
// ----------------------------

// Public
export var loadingScreenDelay = 300;
export var isLogging = true;
export var canNavigateBack = ko.observable(false);
export var pageStackSize = ko.observable(0);

// Variables
var views: { [a: string]: ViewBase } = {};
var viewCount = 0;
var navigationCount = 0;
var navigationHistory = new Array();
var loadedViews: { [key: string]: ILoadingView } = <any>([]);
var isNavigating = false;
var openedDialogs = 0;

// Internationalization variables
export var language = ko.observable(null);
export var supportedLanguages: string[] = <Array<any>>[];
var previousLanguage: string = null;
var languageStrings: { [language: string]: { [path: string]: { [key: string]: string } } } = <any>([]); 

// Local variables
var currentNavigationPath = "";
var currentContext: ViewContext = null;
var defaultFrame: JQuery = null;
var initialLoadingScreenElement: JQuery = null;
var tagAliases: { [key: string]: any } = {};

// Globals for bindings
var globals = {
    navigateBack() { return navigateBack(); },
    navigateHome() { return navigateHome(); },
    canNavigateBack: canNavigateBack,
    pageStackSize: pageStackSize
}

// ----------------------------
// Initializer
// ----------------------------

/**
 * Initializes the framework and navigates to the first page or restores the pages. 
 */
export function initialize(options: IVistoOptions) {
    var rootElement = options.rootElement === undefined ? $("body") : options.rootElement;

    defaultPackage = options.defaultPackage === undefined ? defaultPackage : options.defaultPackage;
    defaultPackage = options.defaultPackage === undefined ? defaultPackage : options.defaultPackage;
    initialLoadingScreenElement = options.initialLoadingScreenElement === undefined ? $(rootElement).find("div") : options.initialLoadingScreenElement;

    setUserLanguage(options.supportedLanguages);

    if (options.registerEnterKeyFix === undefined || options.registerEnterKeyFix) {
        $(document).bind("keypress", ev => {
            if (ev.keyCode === 13 && (<any>ev.target).localName === "input")
                ev.preventDefault();
        });
    }

    createView($(rootElement), options.startView, options.startParameters).done();
}

/**
 * Interface containing the initialization options. 
 */
export interface IVistoOptions {
    rootElement: JQuery;

    startView: string;
    startParameters: { [key: string]: any };

    defaultPackage: string;
    supportedLanguages: string[];
    registerEnterKeyFix: boolean;
    initialLoadingScreenElement: JQuery;
    loadingScreenElement: string;
}

/**
 * Registers an alias for a tag; specify the tag without 'vs-'. 
 */
export function registerTagAlias(tag: string, pkg: string | IModule, viewPath: string) {
    if (tagAliases[tag] !== undefined)
        throw new Error("The tag alias '" + tag + "' is already registered.");

    if (typeof pkg === "string")
        tagAliases[tag] = pkg + ":" + viewPath;
    else
        tagAliases[tag] = getPackageNameForModule(pkg) + ":" + viewPath;
}

export function getViewForViewModel(viewModel: ViewModel): ViewBase {
    return (<any>viewModel).view;
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
    require(moduleNames, (result: any) => { completed(result); }, () => { completed(null); });
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

// Converts a camel case string (myString) into a dashed string ('my-string')
function convertCamelCaseToDashed(data: string) {
    return data.replace(/([A-Z])/g, g => "-" + g.toLowerCase());
}

// ----------------------------
// Remoting
// ----------------------------

var remotePackages: { [packageName: string]: string } = {};

export function registerRemotePackage(packageName: string, remoteUrl: string) {
    if (remotePackages[packageName.toLowerCase()] !== undefined)
        throw new Error("The remote package '" + packageName + "' is already registered.");

    remotePackages[packageName.toLowerCase()] = remoteUrl;
}

function getRemoteBaseUrl(packageName: string) {
    return remotePackages[packageName.toLowerCase()] !== undefined ? remotePackages[packageName.toLowerCase()] + "/" : "";
}

// Replace original RequireJS require function to fix remote dependency loading
var originalDefine = <any>define;
define = <any>((modules: string[], success: (...modules: any[]) => void, failed?: () => void) => {
    if ($.isArray(modules)) {
        for (var packageName in remotePackages) {
            if (remotePackages.hasOwnProperty(packageName)) {
                $.each(modules, (index, module) => {
                    if (module.toLowerCase().indexOf(packageName + "/") === 0)
                        modules[index] = remotePackages[packageName] + "/Scripts/" + module + ".js";
                });
            }
        }
    }

    originalDefine(modules, success, failed);
});

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
export function getPackageNameForModule(module: IModule) {
    var modulePath = "/" + module.id;

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
export function getViewName(module: IModule, viewPath: string) {
    return getPackageNameForModule(module) + ":" + viewPath;
}

/**
 * [Replaceable] Loads the translated string for a given package and language. 
 */
export var getLanguageStrings = (packageName: string, lang: string, completed: (languageStrings: { [key: string]: string }) => void) => {
    var url = getRemoteBaseUrl(packageName) + "Scripts/" + packageName + "/languages/" + lang + ".json";
    $.ajax({
        url: url,
        type: "get",
        dataType: "json",
        global: false
    }).done((result: any) => {
        completed(result);
    }).fail((xhr: any, ajaxOptions: any) => {
        log("Error loading language JSON '" + url + "': " + ajaxOptions);
        completed(<any>([]));
    });
}

/**
 * Loads the language file for the given package and current language with checking.
 */
function loadLanguageStrings(packageName: string, completed: () => void) {
    var lang = language();
    if (languageStrings[lang] === undefined)
        languageStrings[lang] = <any>([]);

    if (languageStrings[lang][packageName] === undefined) {
        var key = packageName + ":" + lang;
        if (languageLoadings[key] === undefined) {
            languageLoadings[key] = [completed];
            getLanguageStrings(packageName, lang, ls => {
                languageStrings[lang][packageName] = ls;
                $.each(languageLoadings[key], (index, item) => { item(); });
                delete languageLoadings[key];
            });
        } else
            languageLoadings[key].push(completed);
    } else
        completed();
};

/**
 * Loads a translated string.
 */
function getString(key: string, packageName: string, completed?: (value: string) => void) {
    packageName = getPackageName(packageName);

    var lang = language();
    if (languageStrings[lang] === undefined)
        languageStrings[lang] = <any>([]);

    if (languageStrings[lang][packageName] === undefined) {
        loadLanguageStrings(packageName, () => { getStringForLanguage(lang, packageName, key, completed); });
        if (previousLanguage !== null)
            return getStringForLanguage(previousLanguage, packageName, key);
        return null;
    } else
        return getStringForLanguage(lang, packageName, key, completed);
};

/**
 * Loads a translated string as observable object which updates when the language changes. 
 */
export function getObservableString(key: string, packageName: string) {
    var observable = ko.observable<string>();
    observable(getString(key, packageName, value => { observable(value); }));
    return observable;
};

/**
 * Loads a translated string for a given language.
 */
function getStringForLanguage(lang: string, packageName: string, key: string, completed?: (...params: string[]) => void) {
    var value = languageStrings[lang][packageName][key];
    if (value === undefined)
        value = packageName + ":" + key;
    if (completed !== undefined)
        completed(value);
    return value;
};

/**
 * Sets the language of the application. 
 */
export function setLanguage(lang: string, supportedLangs?: string[]) {
    if (language() !== lang) {
        previousLanguage = language();
        language(lang);

        if (supportedLangs !== null && supportedLangs !== undefined)
            supportedLanguages = supportedLangs;
    }
};

/**
 * Sets the language to the user preferred language.
 */
export function setUserLanguage(supportedLangs: string[]) {
    var newLanguage: string;

    if (navigator.userLanguage !== undefined)
        newLanguage = navigator.userLanguage.split("-")[0];
    else
        newLanguage = navigator.language.split("-")[0];

    if ($.inArray(newLanguage, supportedLanguages))
        setLanguage(newLanguage, supportedLangs);
    else
        setLanguage(supportedLangs[0], supportedLangs);
};

// ----------------------------
// Events
// ----------------------------

export class Event<TSender, TArgs> {
    private sender: TSender;
    private registrations: ((sender: TSender, args: TArgs) => void)[] = [];

    constructor(sender: TSender) {
        this.sender = sender;
    }

    public add(callback: (sender: TSender, args: TArgs) => void) {
        this.registrations.push(callback);
    }

    public remove(callback: (sender: TSender, args: TArgs) => void) {
        var index = this.registrations.indexOf(callback);
        if (index > -1)
            this.registrations.splice(index, 1);
    }

    public raise(args: TArgs) {
        for (var callback of this.registrations) {
            callback(this.sender, args);
        }
    }
}

// ----------------------------
// Views
// ----------------------------

/**
 * Gets the parent view of the given element.
 */
export function getViewFromElement(element: JQuery): ViewBase {
    var viewId = element.attr(viewIdAttribute);
    if (viewId !== undefined)
        return views[viewId];

    while ((element = element.parent()) != undefined) {
        if (element.length === 0)
            return null;

        viewId = $(element[0]).attr(viewIdAttribute);
        if (viewId !== undefined)
            return views[viewId];
    }
    return null;
};

/**
 * Gets the parent view model of the given element.
 */
export function getViewModelFromElement(element: JQuery): ViewModel {
    var view = <View<any>>getViewFromElement(element);
    if (view !== null && view !== undefined)
        return view.viewModel;
    return null;
}

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
export function initializeDefaultFrame(frame: JQuery, viewName: string, parameters?: {}): Q.Promise<ViewBase>;
export function initializeDefaultFrame(frame: JQuery, module: IModule, viewName: string, parameters?: {}): Q.Promise<ViewBase>;
export function initializeDefaultFrame(frame: JQuery, a: any, b?: any, c?: any): Q.Promise<ViewBase> {
    if (typeof a === "string")
        return initializeDefaultFrameCore(frame, a, b);
    else
        return initializeDefaultFrameCore(frame, getViewName(a, b), c);
}

function initializeDefaultFrameCore(frame: JQuery, fullViewName: string, parameters?: {}) {
    if (defaultFrame !== null)
        throw new Error("The default frame is already initialized.");
    defaultFrame = frame;

    return Q.Promise<ViewBase>((resolve, reject) => {
        var urlSegments = decodeURIComponent(window.location.hash).split("/");
        if (urlSegments.length > 1) {

            isPageRestore = true;
            showLoadingScreen(false);
            var currentSegmentIndex = 1;

            var navigateToNextSegment = (view: ViewBase) => {
                var segment = urlSegments[currentSegmentIndex];
                if (segment != null) {
                    var segmentParts = segment.split(":");
                    var supportsPageRestore = segmentParts.length === 3;
                    if (supportsPageRestore) {
                        currentSegmentIndex++;
                        var fullViewName = segmentParts[0] + ":" + segmentParts[1];
                        var restoreQuery = segmentParts.length === 3 ? segmentParts[2] : undefined;
                        navigateTo(frame, fullViewName, { restoreQuery: restoreQuery }).then((view: ViewBase) => {
                            navigateToNextSegment(view);
                        }).done();
                    } else
                        finishPageRestore(frame, view, resolve);
                } else
                    finishPageRestore(frame, view, resolve);
            };
            navigateToNextSegment(null);
        } else {
            navigateTo(frame, fullViewName, parameters)
                .then((view) => resolve(view))
                .fail(reject);
        }
    });
};

export var isPageRestore = false;

function finishPageRestore(frame: JQuery, view: ViewBase, completed: (view: ViewBase) => void) {
    hideLoadingScreen();
    isPageRestore = false;

    var page = getCurrentPageDescription(frame);
    page.element.removeAttr("style");

    completed(view);
}

/**
 * Navigates to a given page using in the default frame.
 */
export function navigateTo(fullViewName: string, parameters?: {}): Q.Promise<PageBase>;
export function navigateTo(modulePackage: IModule, viewName: string, parameters?: {}): Q.Promise<PageBase>;
export function navigateTo(frame: JQuery, fullViewName: string, parameters?: {}): Q.Promise<PageBase>;
export function navigateTo(a: any, b: any, c?: any): Q.Promise<PageBase> {
    if (typeof a === "string")
        return navigateToCore(defaultFrame, a, b);
    else if (a.uri !== undefined)
        return navigateToCore(defaultFrame, getViewName(a, b), c);
    else
        return navigateToCore(a, b, c);
}

function navigateToCore(frame: JQuery, fullViewName: string, parameters: {}): Q.Promise<PageBase> {
    if (isNavigating)
        throw "Already navigating";

    isNavigating = true;

    // append new invisible page to DOM
    var pageContainer = $(document.createElement("div"));
    pageContainer.css("visibility", "hidden");
    pageContainer.css("position", "absolute");
    frame.append(pageContainer);

    // load currently visible page
    var currentPage = getCurrentPageDescription($(frame));
    showLoadingScreen(currentPage !== null);
    if (currentPage !== null && currentPage !== undefined) {
        return currentPage.view.onNavigatingFrom("forward")
            .then<PageBase>((navigate) => tryNavigateForward(fullViewName, parameters, frame, pageContainer, navigate))
            .then((page) => {
                hideLoadingScreen();
                return page;
            });
    } else {
        return tryNavigateForward(fullViewName, parameters, frame, pageContainer, true).then((page) => {
            hideLoadingScreen();
            return page;
        });
    }
}

/**
 * Navigates back to the home page (first page in stack).
 */
export function navigateHome(): Q.Promise<void> {
    if (navigationCount <= 1) {
        return Q<void>(null);
    } else {
        return navigateBack().then<void>(() => {
            return navigateHome();
        });
    }
}

/**
 * Navigates to the previous page.
 */
export function navigateBack() {
    return Q.Promise<void>((resolve, reject) => {
        if (isNavigating)
            reject("Already navigating");
        else {
            backNavigationResolve = <any>resolve;
            backNavigationReject = reject;
            history.go(-1);
        }
    });
}

var backNavigationResolve: () => void = null;
var backNavigationReject: (reason: any) => void = null;

function tryNavigateBack(navigate: boolean, currentPage: IPage, pageStack: IPage[]) {
    if (navigate) {
        navigationHistory.pop();
        navigationCount--;

        var previousPage = pageStack[pageStack.length - 2];
        currentPage.view.__destroyView();

        pageStack.pop();

        globals.canNavigateBack(pageStack.length > 1);
        globals.pageStackSize(pageStack.length);

        currentPage.element.remove();
        previousPage.element.css("visibility", "visible");
        previousPage.element.css("position", "");

        log("Navigated back to " + previousPage.view.viewClass + ", page stack size: " + pageStack.length);

        previousPage.view.onNavigatedTo("back");
        currentPage.view.onNavigatedFrom("back");

        if ($.isFunction(backNavigationResolve))
            backNavigationResolve();
    } else {
        if (defaultFrame !== null)
            (<any>window).location = "#" + currentPage.hash;

        if ($.isFunction(backNavigationReject))
            backNavigationReject("Cannot navigate back.");
    }

    isNavigating = false;

    backNavigationResolve = null;
    backNavigationReject = null;
}

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
                        currentPage.view.onNavigatingFrom("back").then((navigate: boolean) => {
                            tryNavigateBack(navigate, currentPage, pageStack);
                        }).done();
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
 * Shows a modal dialog. The provided promise is resolved when the dialog has been closed. 
 */
export function showDialog(fullViewName: string, parameters?: { [key: string]: any }, onLoaded?: (view: DialogBase) => void): Q.Promise<DialogBase>;
export function showDialog(modulePackage: IModule, viewName: string, parameters?: { [key: string]: any }, onLoaded?: (view: DialogBase) => void): Q.Promise<DialogBase>;
export function showDialog(a: any, b: any, c?: any, d?: any): Q.Promise<DialogBase> {
    if (typeof a === "string")
        return showDialogCore(a, b, c);
    else
        return showDialogCore(getViewName(a, b), c, d);
}

function showDialogCore(fullViewName: string, parameters: { [key: string]: any }, onLoaded?: (view: DialogBase) => void) {
    return Q.Promise<DialogBase>((resolve, reject) => {
        var container = $("<div style=\"display:none\" />");
        $("body").append(container);

        if (parameters === undefined)
            parameters = {};
        parameters[isDialogParameter] = true;

        showLoadingScreen();
        createView(container, fullViewName, <any>parameters).then((view: DialogBase) => {
            openedDialogs++;

            // Remove focus from element of the underlying page to avoid click events on enter press
            var focusable = $("a,frame,iframe,label,input,select,textarea,button:first");
            if (focusable != null) {
                focusable.focus();
                focusable.blur();
            }

            showNativeDialog($(container.children().get(0)), view, parameters,
                () => { view.onShown(); },
                () => {
                    openedDialogs--;

                    view.onClosed();
                    view.__destroyView();
                    container.remove();

                    resolve(view);
                });
            container.removeAttr("style");

            hideLoadingScreen();
            if ($.isFunction(onLoaded))
                onLoaded(view);
        }).fail(reject);
    });
}

export enum DialogResult {
    Undefined,
    Ok,
    Cancel,
    Yes,
    No,
}

/**
 * [Replaceable] Creates and shows a native dialog (supports Bootstrap and jQuery UI dialogs). 
 */
export var showNativeDialog = (container: JQuery, view: Dialog<ViewModel>, parameters: { [key: string]: any }, onShown: () => void, onClosed: () => void) => {
    var dialog = <any>container;

    if (dialog.modal !== undefined) {
        // Bootstrap dialog
        dialog.modal({});
        dialog.on("shown.bs.modal", () => { onShown(); });
        dialog.on("hidden.bs.modal", () => { onClosed(); });
    } else {
        // JQuery UI dialog: 
        dialog.bind('dialogclose', () => {
            dialog.dialog("destroy");
            onClosed();
        });
        onShown();
    }
}

/**
 * [Replaceable] Closes the native dialog (supports Bootstrap and jQuery UI dialogs). 
 */
export var closeNativeDialog = (container: JQuery) => {
    var dialog = <any>container;

    if (dialog.modal !== undefined) {
        // Bootstrap dialog
        dialog.modal("hide");
    } else {
        // JQuery UI dialog
        dialog.dialog("close");
    }
}

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
    update(element: Element, valueAccessor: any): void {
        var value = <{ [key: string]: any }>ko.utils.unwrapObservable(valueAccessor());
        var viewName = (<any>value).name; 

        // destroy if view is already loaded and only viewName has changed
        var viewId = $(element).attr(viewIdAttribute);
        if (viewId !== undefined) {
            var view = views[viewId];
            if (view !== null && view !== undefined) {
                if (view.viewName === viewName || view.viewName === defaultPackage + ":" + viewName)
                    return; // only rebuild when viewName changed
            
                view.__destroyView();
            }
        }

        var rootView: ViewBase = null;
        if (currentContext !== null)
            rootView = currentContext.rootView;

        var factory = new ViewFactory();
        factory.create($(element), viewName, value, view => {
            ko.utils.domNodeDisposal.addDisposeCallback(element, () => { view.__destroyView(); });
            if (rootView !== null)
                rootView.__addSubView(view);
        });
    }
};

// ----------------------------
// Paging
// ----------------------------

/**
 * Gets the current page from the given frame or the default frame. 
 */
export function getCurrentPage(frame?: JQuery): PageBase {
    var description = getCurrentPageDescription(frame);
    if (description !== null && description !== undefined)
        return description.view;
    return null;
}

function getCurrentPageDescription(frame: JQuery): IPage {
    var pageStack = getPageStack(frame);
    if (pageStack.length > 0)
        return pageStack[pageStack.length - 1];
    return null;
}

function getPageStack(element: JQuery) {
    var pageStack: any = element.data(pageStackAttribute);
    if (pageStack === null || pageStack === undefined) {
        pageStack = new Array();
        element.data(pageStackAttribute, pageStack);
    }
    return <IPage[]>pageStack;
}

function tryNavigateForward(fullViewName: string, parameters: any, frame: JQuery, pageContainer: JQuery, navigate: boolean): Q.Promise<PageBase> {
    if (navigate) {
        if (parameters === undefined || parameters == null)
            parameters = {};

        parameters[isPageParameter] = true;

        return createView(pageContainer, fullViewName, parameters).then((view: PageBase) => {
            var restoreQuery = view.parameters.getRestoreQuery();
            currentNavigationPath = currentNavigationPath + "/" + encodeURIComponent(
                view.viewName + (restoreQuery !== undefined && restoreQuery !== null ? (":" + restoreQuery) : ""));

            if (defaultFrame !== null)
                (<any>window).location = "#" + currentNavigationPath;

            navigationHistory.push(frame);

            // current page
            var currentPage = getCurrentPageDescription(frame);
            if (currentPage !== null && currentPage !== undefined) {
                currentPage.element.css("visibility", "hidden");
                currentPage.element.css("position", "absolute");
            }

            // show next page by removing hiding css styles
            if (!isPageRestore)
                pageContainer.removeAttr("style");

            //pageContainer.replaceWith(view.element);
            //pageContainer = view.element;

            var pageStack = getPageStack(frame);
            pageStack.push(<IPage>{
                view: view,
                hash: ++navigationCount,
                element: pageContainer
            });

            globals.canNavigateBack(pageStack.length > 1);
            globals.pageStackSize(pageStack.length);

            log("Navigated to new page " + view.viewClass + ", page stack size: " + pageStack.length);

            view.onNavigatedTo("forward");

            if (currentPage !== null && currentPage !== undefined)
                currentPage.view.onNavigatedFrom("forward");

            isNavigating = false;
            return view;
        });
    } else
        return Q<PageBase>(null);
};

// ----------------------------
// Loading screen
// ----------------------------

var loadingCount = 0;
var currentLoadingScreenElement: JQuery = null;
var loadingScreenElement = "<div class=\"loading-screen\"><img src=\"Content/Images/loading.gif\" class=\"loading-screen-image\" alt=\"Loading...\" /></div>"; 

/**
 * Shows the loading screen. Always call hideLoadingScreen() for each showLoadingScreen() call. 
 */
export function showLoadingScreen(delayed?: boolean) {
    if (initialLoadingScreenElement !== null) {
        initialLoadingScreenElement.remove();
        initialLoadingScreenElement = null;
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
};

function appendLoadingElement() {
    if (currentLoadingScreenElement === null) {
        currentLoadingScreenElement = $(loadingScreenElement);
        $("body").append(currentLoadingScreenElement);
    }
}

/**
 * Hides the loading screen. 
 */
export function hideLoadingScreen() {
    loadingCount--;
    if (loadingCount === 0) {
        if (currentLoadingScreenElement !== null) {
            currentLoadingScreenElement.remove();
            currentLoadingScreenElement = null;
        }
    }
};

// ----------------------------
// View model
// ----------------------------

export class ViewModel {
    /**
     * Gets some global objects to use in bindings. 
     */
    globals = globals;

    /**
     * Gets the parameters provided by the creator of the view (e.g. attributes on the custom tag). 
     */
    parameters: Parameters;

    private view: ViewBase;

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
        this.parameters.setRestoreQuery(restoreQuery === undefined ? "" : restoreQuery);
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
     * Loads a translated string which is internally observed (should only be called in a view, e.g. <vs-my-view my-text="translate('key')">).
     */
    translate(key: string) {
        return getObservableString(key, this.view.viewPackage)();
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
    onLoading() {
        return Q<void>(null);
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
    /**
     * Gets the view ID which is globally unique between all views. 
     */
    viewId: string;

    /**
     * Gets the full name of the view, i.e. the path and class name. 
     */
    viewName: string;

    /**
     * Gets the view's TypeScript class name. 
     */
    viewClass: string;

    /**
     * Gets the name of the package where this view is located. 
     */
    viewPackage: string;

    /**
     * Gets the view element which originally was the custom tag (not available in ctor, initialize() and onLoading()). 
     */
    element: JQuery; 

    /**
     * Gets the parameters provided by the creator of the view (e.g. attributes on the custom tag). 
     */
    parameters: Parameters;

    /**
     * Gets the view's parent view. 
     */
    viewParent: ViewBase = null;

    /**
     * Gets the view's direct child views.
     */
    viewChildren = ko.observableArray<ViewBase>();

    private isDestroyed = false;
    private subViews: ViewBase[] = <Array<any>>[];
    private disposables: IDisposable[] = <Array<any>>[];

    /**
     * Sets the view model to the view model of the parent view (must be called in the view's initialize() method). 
     * The view cannot have an own view model class. 
     */
    inheritViewModelFromParent() {
        (<any>this).viewModel = (<any>this.viewParent).viewModel;
    }

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
     * Finds elements inside this view with a selector. 
     */
    findElements(selector: string) {
        return this.element.find(selector);
    }

    /**
     * Gets an element by ID (defined using the "vs-id" attribute) inside this view. 
     */
    getViewElement(id: string) {
        return this.findElements("#" + this.viewId + "_" + id);
    }

    isViewLoaded = ko.observable<boolean>(false);

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
    onLoading<T>(): Q.Promise<T> {
        return Q<T>(null);
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

    // ReSharper disable InconsistentNaming

    __destroyView() {
        $.each(this.subViews, (index: number, view: ViewBase) => {
            view.__destroyView();
        });

        if (!this.isDestroyed) {
            log("Destroying view '" + this.viewId + "' (" + this.viewClass + ") with " +
                this.subViews.length + " subviews");

            delete views[this.viewId];

            (<View<ViewModel>>this).viewModel.destroy();
            this.destroy();

            $.each(this.disposables, (index: number, item: IDisposable) => {
                item.dispose();
            });

            if (this.viewParent != null)
                this.viewParent.viewChildren.remove(this);

            this.isDestroyed = true;
        }
    }

    __setViewParent(viewParent: ViewBase) {
        if (this.viewParent !== null)
            throw "Parent view has already been set.";

        this.viewParent = viewParent;
        if (this.viewParent != null)
            this.viewParent.viewChildren.push(this);
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
    onNavigatingFrom(type: string): Q.Promise<boolean> {
        return Q(true);
    }
}

export class PageBase extends Page<ViewModel> {

}

// ----------------------------
// Dialog
// ----------------------------

export class Dialog<TViewModel extends ViewModel> extends View<TViewModel> {
    /**
     * Gets the dialog result. 
     */
    result = DialogResult.Undefined;

    /**
     * Closes the dialog. 
     */
    close(result?: DialogResult) {
        this.result = result;
        closeNativeDialog(this.element);
    }

    /**
     * [Virtual] Called when the dialog is shown and all animations have finished. 
     */
    onShown() {

    }

    /**
     * [Virtual] Called after the dialog has been closed. 
     */
    onClosed() {

    }
}

export class DialogBase extends Dialog<ViewModel> {

}

// ----------------------------
// Parameters
// ----------------------------

export class Parameters {
    private parameters: { [key: string]: any } = {};
    private originalParameters: { [key: string]: any } = {};
    private fullViewName: string;

    tagContent: JQuery;
    tagContentHtml: string;

    constructor(fullViewName: string, parameters: {}, element: JQuery) {
        this.fullViewName = fullViewName;

        if (parameters !== undefined && parameters !== null)
            this.originalParameters = <any>(parameters);

        this.tagContentHtml = element.get(0).innerHTML;
        var content = $(document.createElement("div"));
        content.html(this.tagContentHtml);
        this.tagContent = content;
    }

    getObservableString(key: string, defaultValue?: string): KnockoutObservable<string> {
        return this.getObservableWithConversion(key, (value: any) => value.toString(), defaultValue);
    }

    getObservableNumber(key: string, defaultValue?: number): KnockoutObservable<number> {
        return this.getObservableWithConversion(key, (value: any) => Number(value), defaultValue);
    }

    getObservableBoolean(key: string, defaultValue?: boolean): KnockoutObservable<boolean> {
        return this.getObservableWithConversion(key, (value: any) => value.toString().toLowerCase() === "true", defaultValue);
    }

    getObservableObject<T>(key: string, defaultValue?: T) {
        return this.getObservableWithConversion(key, (value: any) => value, defaultValue);
    }

    getString(key: string, defaultValue?: string) {
        return this.getObservableString(key, defaultValue)();
    }

    getNumber(key: string, defaultValue?: number) {
        return this.getObservableNumber(key, defaultValue)();
    }

    getBoolean(key: string, defaultValue?: boolean) {
        return this.getObservableBoolean(key, defaultValue)();
    }

    getObject<T>(key: string, defaultValue?: T) {
        return this.getObservableObject(key, defaultValue)();
    }

    /**
     * Gets a function parameter and sets the this/caller to the parent element's view model if no caller is set.
     */
    getFunction(key: string, viewModel: ViewModel): any {
        var func = this.getObject<any>("click", null);
        if (func === null)
            return null;

        return function () {
            if (func.caller !== undefined && func.caller !== null)
                return func;

            var parentElement = (<any>viewModel).view.element.parent()[0];
            var parentViewModel = ko.contextFor(parentElement).$data;
            return func.apply(parentViewModel, arguments);
        };
    }

    setValue<T>(key: string, value: T) {
        var observable = this.getObservableObject<T>(key, value);
        observable(value);
    }

    getRestoreQuery(): string {
        return this.originalParameters["restoreQuery"];
    }

    setRestoreQuery(restoreQuery: string) {
        this.originalParameters["restoreQuery"] = restoreQuery;
    }

    getObservableArray<T>(key: string, defaultValue?: T[]): KnockoutObservableArray<T> {
        if (this.parameters[key] === undefined) {
            if (this.originalParameters[key] !== undefined) {
                if (this.originalParameters[key].notifySubscribers !== undefined)
                    this.parameters[key] = this.originalParameters[key];
                else
                    this.parameters[key] = ko.observableArray(this.originalParameters[key]);
            } else {
                var tagContentChild = this.readTagContentChild(key);
                if (tagContentChild !== null)
                    this.parameters[key] = ko.observableArray(tagContentChild);
                else if (defaultValue !== undefined)
                    this.parameters[key] = ko.observableArray(defaultValue);
                else
                    throw new Error("The parameter '" + key + "' is not defined and no default value is provided in view '" + this.fullViewName + "'.");
            }
        }
        return this.parameters[key];
    }

    private getObservableWithConversion<T>(key: string, valueConverter: (value: any) => T, defaultValue: T): KnockoutObservable<T> {
        if (this.parameters[key] === undefined) {
            if (this.originalParameters[key] !== undefined) {
                if (this.originalParameters[key].notifySubscribers !== undefined)
                    this.parameters[key] = this.originalParameters[key];
                else
                    this.parameters[key] = ko.observable(valueConverter(this.originalParameters[key]));
            } else {
                var tagContentChild = this.readTagContentChild(key);
                if (tagContentChild !== null)
                    this.parameters[key] = ko.observable(tagContentChild);
                else if (defaultValue !== undefined)
                    this.parameters[key] = ko.observable(defaultValue);
                else
                    throw new Error("The parameter '" + key + "' is not defined and no default value is provided in view '" + this.fullViewName + "'.");
            }
        }
        return this.parameters[key];
    }

    private readTagContentChild(key: string): any {
        var tagName = convertCamelCaseToDashed(key);
        var elements = $.grep(<HTMLElement[]>this.tagContent.children().get(), (element) => element.tagName.toLowerCase() === tagName);
        if (elements.length === 1)
            return this.createObjectFromElement($(elements[0]));
        return null;
    }

    private createObjectFromElement(element: JQuery): any {
        var children = element.children();
        if (children.length > 0) {
            var array: any[] = <any[]>[];
            children.each((index: number, child: Element) => {
                array.push(this.createObjectFromElement($(child)));
            });
            return array;
        } else {
            var object: { [key: string]: any } = {};
            object["html"] = element.get(0).innerHTML;
            $.each(element.get(0).attributes, (index: number, attr: Attr) => {
                object[attr.name] = attr.value; // TODO: Also evaluate bindings 
            });
            return object;
        }
    }
}

// ----------------------------
// View factory
// ----------------------------

export function createView(element: JQuery, fullViewName: string, parameters: { [key: string]: any }) {
    return Q.Promise<ViewBase>((resolve) => {
        var factory = new ViewFactory();
        factory.create(element, fullViewName, parameters, (view) => {
            resolve(view);
        });
    });
};

class ViewFactory {
    element: JQuery;
    rootElement: JQuery;
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

    completed: (view: ViewBase) => void;

    create(element: JQuery, fullViewName: string, parameters: {}, completed: (view: ViewBase) => void) {
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
        this.parameters = new Parameters(fullViewName, parameters, element);
        element.html("");

        var lazySubviewLoading = this.parameters.getBoolean(lazyViewLoadingOption, false);
        if (!lazySubviewLoading)
            this.context.viewCount++;

        this.loadScriptsAndLanguageFile();
    }

    private loadScriptsAndLanguageFile() {
        var count = 3;

        var viewUrl = this.viewLocator.package + "/views/" + this.viewLocator.view;
        var viewModelUrl = this.viewLocator.package + "/viewModels/" + this.viewLocator.view + "Model";

        var baseUrl = getRemoteBaseUrl(this.viewLocator.package);
        if (baseUrl !== "") {
            viewUrl = baseUrl + viewUrl + ".js";
            viewModelUrl = baseUrl + viewModelUrl + ".js";
        }

        tryRequire([viewUrl], (m: any) => {
            this.viewModule = m;
            if ((--count) === 0)
                this.loadHtml();
        });

        tryRequire([viewModelUrl], (m: any) => {
            this.viewModelModule = m;
            if ((--count) === 0)
                this.loadHtml();
        });

        loadLanguageStrings(this.viewLocator.package, () => {
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
                data: <any>null,
                running: true,
                callbacks: [(data) => this.htmlLoaded(data)]
            };

            log("Loading view from server: " + this.viewLocator.name);

            var baseUrl = getRemoteBaseUrl(this.viewLocator.package);
            $.ajax({
                url: baseUrl + "Scripts/" + this.viewLocator.package + "/views/" + this.viewLocator.view + ".html",
                dataType: "html",
                global: false
            }).done((data: string) => {
                data = this.processCustomTags(data);
                data = this.processKnockoutAttributes(data);

                loadedViews[this.viewLocator.name].data = data;
                loadedViews[this.viewLocator.name].running = false;
                $.each(loadedViews[this.viewLocator.name].callbacks, (index, item) => {
                    item(data);
                });
            }).fail(() => {
                var data = "<span>[View '" + this.viewLocator.name + "' not found]</span>";

                loadedViews[this.viewLocator.name].data = data;
                loadedViews[this.viewLocator.name].running = false;
                $.each(loadedViews[this.viewLocator.name].callbacks, (index, item) => {
                    item(data);
                });
            });
        }
    }

    private htmlLoaded(htmlData: string) {
        this.viewId = "view_" + ++viewCount;

        htmlData =
        "<!-- ko stopBinding -->" +
        htmlData
            .replace(/vs-id="/g, "id=\"" + this.viewId + "_")
            .replace(/\[\[viewid\]\]/gi, this.viewId) +
        "<!-- /ko -->";

        var container = $(document.createElement("div"));
        container.html(htmlData);

        this.rootElement = $(container.children()[0]);
        this.element.attr(viewIdAttribute, this.viewId);

        this.view = this.instantiateView();
        this.viewModel = this.instantiateViewModel(this.view);

        // initialize and retrieve restore query
        this.view.initialize(this.parameters);
        this.viewModel.initialize(this.parameters);
        this.viewModel = (<any>this.view).viewModel; // may be changed by inheritViewModelFromParent()

        if (this.isRootView)
            this.context.restoreQuery = this.parameters.getRestoreQuery();

        var lazySubviewLoading = this.parameters.getBoolean(lazyViewLoadingOption, false);
        if (lazySubviewLoading) {
            this.__setHtml();
            ko.applyBindings(this.viewModel, this.rootElement.get(0));
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
            ko.applyBindings(this.viewModel, this.rootElement.get(0));
            currentContext = null;

            this.context.loaded();
        }

        if ($.isFunction(this.completed))
            this.completed(this.view);
    }

    private instantiateView() {
        var view: ViewBase;

        var hasView = this.viewModule !== undefined && this.viewModule !== null;
        if (hasView)
            view = <ViewBase>(new this.viewModule[this.viewLocator.className]());
        else {
            if (this.parameters.getBoolean(isPageParameter, false))
                view = new Page();
            else if (this.parameters.getBoolean(isDialogParameter, false))
                view = new Dialog();
            else
                view = new View();
        }

        view.element = this.rootElement;
        view.viewId = this.viewId;

        view.viewName = this.viewLocator.name;
        view.viewClass = this.viewLocator.className;
        view.viewPackage = this.viewLocator.package;

        view.parameters = this.parameters;
        view.__setViewParent(this.parentView);

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
     * Process custom tags in the given HTML data string.
     */
    private processCustomTags(data: string) {
        data = data
            .replace(/vs-translate="(.*?)"/g, (match: string, key: string) => { return 'vs-html="{translate(\'' + key + '\')}"'; })
            .replace(/vs-bind="/g, "data-bind=\"")
            .replace(/<vs-([a-zA-Z0-9-]+?)(( ([^]*?)(\/>|>))|(\/>|>))/g, (match: string, tagName: string, tagWithoutAttributesClosing: string, unused2: string, attributes: string, tagClosing: string) => {
                if (tagClosing == undefined) {
                    tagClosing = tagWithoutAttributesClosing;
                    attributes = "";
                }

                var path = "";
                var pkg = "";

                var bindings = "";
                var htmlAttributes = "";

                attributes.replace(/([a-zA-Z0-9-]*?)="([^]*?)"/g, (match: string, attributeName: string, attributeValue: string) => {
                    if (attributeName.indexOf("vs-") === 0) {
                        htmlAttributes += " " + match;
                        return match;
                    } else {
                        attributeName = convertDashedToCamelCase(attributeName.trim());
                        if (attributeName === "path")
                            path = attributeValue;
                        else if (attributeName === "package")
                            pkg = attributeValue;
                        else if (startsWith(attributeValue, "{") && endsWith(attributeValue, "}")) {
                            attributeValue = attributeValue.substr(1, attributeValue.length - 2);
                            if (attributeValue.indexOf("(") > -1)
                                attributeValue = "ko.computed(function () { return " + attributeValue + "; })";
                            bindings += attributeName + ": " + attributeValue + ", ";
                        }
                        else
                            bindings += attributeName + ": '" + attributeValue + "', ";
                        return match;
                    }
                });

                var view = convertDashedToCamelCase(tagName);
                view = view[0].toUpperCase() + view.substr(1);
                view = path === "" ? view : path + "/" + view;

                if (tagAliases[tagName] !== undefined)
                    bindings += "name: '" + tagAliases[tagName] + "'";
                else
                    bindings += "name: " + (pkg === "" ? "'" + view + "'" : "'" + pkg + ":" + view + "'");

                return '<span data-bind="view: { ' + bindings + ' }" ' + htmlAttributes + tagClosing;
            });

        return data.replace(/<\/vs-([a-zA-Z0-9-]+?)>/g, "</span>");
    }

    /**
     * Process Knockout attributes (vs-) in the given HTML data string (must be called after processCustomTags).
     */
    private processKnockoutAttributes(data: string) {
        data = data.replace(/<([a-zA-Z0-9-]+?) ([^]*?)(\/>|>)/g, (match: string, tagName: string, attributes: string, tagClosing: string) => {
            var existingDataBindValue = "";
            var additionalDataBindValue = "";

            attributes = attributes.replace(/([a-zA-Z0-9-]+?)="([^]*?)"/g, (match: string, key: string, value: string) => {
                if (key.indexOf("vs-") === 0 && key !== "vs-id") {
                    var knockoutBindingHandler = convertDashedToCamelCase(key.substr(3));
                    var knockoutBindingValue = (value.length > 0 && value[0] === "{" ? value.substr(1, value.length - 2) : "'" + value + "'");
                    additionalDataBindValue += ", " + knockoutBindingHandler + ": " + knockoutBindingValue;
                    return "";
                }
                else if (key === "data-bind") {
                    existingDataBindValue = value;
                    return "";
                }
                else
                    return match;
            });

            if (existingDataBindValue !== "" || additionalDataBindValue !== "") {
                if (existingDataBindValue === "")
                    additionalDataBindValue = additionalDataBindValue.substr(2); // remove unused ", "
                return "<" + tagName + " " + attributes + " data-bind=\"" + existingDataBindValue + additionalDataBindValue + "\"" + tagClosing;
            }

            return match;
        });

        return data.replace(/{{(.*?)}}/g, g => "<span data-bind=\"text: " + g.substr(2, g.length - 4) + "\"></span>");
    }

    // ReSharper disable InconsistentNaming

    __raiseLoadedEvents() {
        this.view.onLoaded();
        this.viewModel.onLoaded();

        this.view.isViewLoaded(true);
    }

    __setHtml() {
        //this.element.replaceWith(this.rootElement);
        //this.rootElement = this.element;
        this.element.html(<any>this.rootElement);
    }

    // ReSharper restore InconsistentNaming
}

class ViewContext {
    factories: ViewFactory[] = <Array<any>>[];
    initializers: (() => void)[] = <Array<any>>[];

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
            $.each(this.factories, (index: number, context: ViewFactory) => {
                context.view.onLoading().then(() => {
                    this.loadedViewCount++;
                    if (this.loadedViewCount === this.viewCount) {
                        this.loadedViewCount = 0;
                        $.each(this.factories, (index: number, context: ViewFactory) => {
                            context.viewModel.onLoading().then(() => {
                                this.loadedViewCount++;
                                if (this.loadedViewCount === this.viewCount) {
                                    $.each(this.factories.reverse(), (index: number, factory: ViewFactory) => {
                                        factory.__setHtml();
                                    });

                                    if ($.isFunction(this.completed))
                                        this.completed(this.rootView, (<any>this.rootView).viewModel, this.restoreQuery);

                                    $.each(this.factories, (index: number, factory: ViewFactory) => {
                                        factory.__raiseLoadedEvents();
                                    });

                                    $.each(this.initializers, (index: number, initializer: () => void) => {
                                        initializer();
                                    });
                                }
                            }).done();
                        });
                    }
                }).done();
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
    navigateBack(): Q.Promise<void>;
}
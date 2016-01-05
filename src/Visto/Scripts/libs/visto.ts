// Visto JavaScript Framework (VistoJS) v2.1.2
// (c) Rico Suter - http://visto.codeplex.com/
// License: Microsoft Public License (Ms-PL) (https://visto.codeplex.com/license)

/// <reference path="jquery.d.ts" />
/// <reference path="knockout.d.ts" />
/// <reference path="q.d.ts" />
/// <reference path="visto.modules.d.ts" />

declare function require(module: any, success: (...modules: any[]) => void, failed?: () => void): void;
declare function require(modules: string[], success: (...modules: any[]) => void, failed?: () => void): void;

export import __hashchange = require("libs/hashchange");

// ----------------------------
// Globals
// ----------------------------

var urlNavigationHistory: VistoContext[] = [];

// ----------------------------
// Constants
// ----------------------------

//var viewIdAttribute = "visto-view-id";
var pageStackAttribute = "page-stack";
var lazyViewLoadingOption = "lazyLoading";

var isPageParameter = "__isPage";
var isDialogParameter = "__isDialog";

var defaultPackage = "app";

// ----------------------------
// Initializer
// ----------------------------

/**
 * Initializes the framework and navigates to the first page or restores the pages. 
 */
export function initialize(options: IVistoOptions) {
    var rootElement = options.rootElement === undefined ? $("body") : options.rootElement;

    var vistoContext = new VistoContext();
    vistoContext.setUserLanguage(options.supportedLanguages);
    vistoContext.resourceManager = options.resourceManager === undefined ? new ResourceManager() : options.resourceManager;
    vistoContext.initialLoadingScreenElement = options.initialLoadingScreenElement === undefined ? $(rootElement).find("div") : options.initialLoadingScreenElement;

    if (options.registerEnterKeyFix === undefined || options.registerEnterKeyFix) {
        $(document).bind("keypress", ev => {
            if (ev.keyCode === 13 && (<any>ev.target).localName === "input")
                ev.preventDefault();
        });
    }

    var factory = new ViewFactory();
    return factory.create($(rootElement), options.startView, options.startParameters, vistoContext).then(() => {
        return vistoContext;
    });
}

/**
 * Interface containing the initialization options. 
 */
export interface IVistoOptions {
    rootElement?: JQuery;

    startView: string;
    startParameters?: { [key: string]: any };

    supportedLanguages: string[];
    registerEnterKeyFix?: boolean;
    initialLoadingScreenElement?: JQuery;

    resourceManager?: ResourceManager;
}

// ----------------------------
// Context
// ----------------------------

var currentViewContext: ViewFactoryContext = null;
var currentContext: VistoContext = null;

export class VistoContext {
    resourceManager: ResourceManager;

    // ----------------------------
    // Internationalization
    // ----------------------------

    language = ko.observable(null);
    languageStrings: { [language: string]: { [path: string]: { [key: string]: string } } } = {};
    languageLoadings: { [key: string]: Q.Promise<{ [key: string]: string }> } = {};
    previousLanguage: string = null;
    supportedLanguages: string[] = <Array<any>>[];

    /**
     * Loads a translated string as observable object which updates when the language changes. 
     */
    getObservableString(key: string, packageName: string) {
        var observable = ko.observable<string>();
        observable(this.getString(key, packageName, value => { observable(value); }));
        return observable;
    }

    /**
     * Sets the language of the application. 
     */
    setLanguage(lang: string, supportedLangs?: string[]) {
        if (this.language() !== lang) {
            if (supportedLangs !== null && supportedLangs !== undefined)
                this.supportedLanguages = supportedLangs;

            if (this.supportedLanguages.indexOf(lang) === -1)
                throw "setLanguage: The provided language is not supported.";

            this.previousLanguage = this.language();
            this.language(lang);
        }
    }

    /**
     * Sets the language to the user preferred language.
     */
    setUserLanguage(supportedLangs: string[]) {
        var newLanguage: string;

        if (navigator.userLanguage !== undefined)
            newLanguage = navigator.userLanguage.split("-")[0];
        else
            newLanguage = navigator.language.split("-")[0];

        if (this.supportedLanguages.indexOf(newLanguage) !== -1)
            this.setLanguage(newLanguage, supportedLangs);
        else
            this.setLanguage(supportedLangs[0], supportedLangs);
    }

    /**
     * Loads a translated string for a given language.
     */
    private getStringForLanguage(lang: string, packageName: string, key: string, completed?: (...params: string[]) => void) {
        var value = this.languageStrings[lang][packageName][key];
        if (value === undefined)
            value = packageName + ":" + key;
        if (completed !== undefined)
            completed(value);
        return value;
    }

    /**
     * Loads the language file for the given package and current language with checking.
     */
    loadLanguageStrings(packageName: string) {
        var lang = this.language();

        if (this.languageStrings[lang] === undefined)
            this.languageStrings[lang] = <any>([]);

        var key = packageName + ":" + lang;
        if (this.languageStrings[lang][packageName] === undefined) {
            if (this.languageLoadings[key] === undefined) {
                this.languageLoadings[key] = this.resourceManager.getLanguageStrings(packageName, lang).then(ls => {
                    this.languageStrings[lang][packageName] = ls;
                    return ls;
                });
            }
        }
        return this.languageLoadings[key];
    }

    /**
     * Loads a translated string.
     */
    getString(key: string, packageName: string, completed?: (value: string) => void) {
        packageName = getPackageName(packageName);

        var lang = this.language();
        if (this.languageStrings[lang] === undefined)
            this.languageStrings[lang] = <any>([]);

        if (this.languageStrings[lang][packageName] === undefined) {
            this.loadLanguageStrings(packageName).done(() => {
                this.getStringForLanguage(lang, packageName, key, completed);
            });

            // Not loaded yet
            if (this.previousLanguage !== null)
                return this.getStringForLanguage(this.previousLanguage, packageName, key);
            return null;
        } else
            return this.getStringForLanguage(lang, packageName, key, completed);
    }

    // ----------------------------
    // Dialogs
    // ----------------------------

    /**
     * Shows a modal dialog. The provided promise is resolved when the dialog has been closed. 
     */
    showDialog(fullViewName: string, parameters?: { [key: string]: any }): Q.Promise<DialogBase>;
    showDialog(modulePackage: IModule, viewName: string, parameters?: { [key: string]: any }): Q.Promise<DialogBase>;
    showDialog(a: any, b: any, c?: any): Q.Promise<DialogBase> {
        if (typeof a === "string")
            return <any>this.showDialogCore(a, b);
        else
            return <any>this.showDialogCore(getViewName(a, b), c);
    }

    private showDialogCore(fullViewName: string, parameters: { [key: string]: any }) {
        return Q.Promise<DialogBase>((resolve, reject) => {
            var container = $("<div />");
            $("body").append(container);

            if (parameters === undefined)
                parameters = {};
            parameters[isDialogParameter] = true;

            this.showLoadingScreen();

            var factory = new ViewFactory();
            return factory.create(container, fullViewName, <any>parameters, this).then((view: DialogBase) => {
                view.dialogElement = $(container.children().get(0)); 

                openedDialogs++;

                // Remove focus from element of the underlying page to avoid click events on enter press
                var focusable = $("a,frame,iframe,label,input,select,textarea,button:first");
                if (focusable != null) {
                    focusable.focus();
                    focusable.blur();
                }

                showNativeDialog(view.dialogElement, view, parameters,
                    () => {
                        view.onShown();
                    }, () => {
                        openedDialogs--;

                        view.onClosed();
                        view.__destroyView();
                        container.remove();

                        resolve(view);
                    });

                container.css("visibility", "");
                container.css("position", "");

                this.hideLoadingScreen();
            }, reject);
        });
    }

    // ----------------------------
    // Paging
    // ----------------------------

    frame: JQuery = null;
    isNavigating = false;

    canNavigateBack = ko.observable(false);
    pageStackSize = ko.observable(0);

    private currentNavigationPath = "";
    private navigationCount = 0;

    /**
     * Gets the current page from the given frame or the default frame. 
     */
    getCurrentPage(): PageBase {
        var description = this.getCurrentPageDescription();
        if (description !== null && description !== undefined)
            return description.view;
        return null;
    }

    private getCurrentPageDescription(): IPage {
        var pageStack = this.getPageStack();
        if (pageStack.length > 0)
            return pageStack[pageStack.length - 1];
        return null;
    }

    private getPageStack() {
        var pageStack: any = this.frame.data(pageStackAttribute);
        if (pageStack === null || pageStack === undefined) {
            pageStack = new Array();
            this.frame.data(pageStackAttribute, pageStack);
        }
        return <IPage[]>pageStack;
    }

    private tryNavigateForward(element: JQuery, fullViewName: string, parameters: any, frame: JQuery,
        onHtmlLoaded?: (view: ViewBase) => void, onDomUpdated?: (view: ViewBase) => void): Q.Promise<ViewBase> {

        if (parameters === undefined || parameters == null)
            parameters = {};

        parameters[isPageParameter] = true;

        var factory = new ViewFactory();
        return factory.create(element, fullViewName, parameters, this, (view: ViewBase) => {
            (<any>element.get(0)).vistoView = view;

            var restoreQuery = view.parameters.getRestoreQuery();
            this.currentNavigationPath = this.currentNavigationPath + "/" + encodeURIComponent(
                view.viewName + (restoreQuery !== undefined && restoreQuery !== null ? (":" + restoreQuery) : ""));

            // CUSTOM
            if (this.frame !== null)
                (<any>window).location = "#" + this.currentNavigationPath;

            urlNavigationHistory.push(view.context);

            var currentPage = this.getCurrentPageDescription();
            if (currentPage !== null && currentPage !== undefined) {
                // CUSTOM: Comment out
                currentPage.element.css("visibility", "hidden");
                currentPage.element.css("position", "absolute");
            }

            // show next page by removing hiding css styles
            if (!this.isPageRestore) {
                element.css("visibility", "");
                element.css("position", "");
            }

            var pageStack = this.getPageStack();
            pageStack.push(<IPage>{
                view: view,
                hash: ++this.navigationCount,
                element: element
            });

            this.canNavigateBack(pageStack.length > 1);
            this.pageStackSize(pageStack.length);

            log("Navigated to\n" +
                "  New page: " + view.viewClass + "\n" +
                "  Page stack size: " + pageStack.length);

            if ($.isFunction((<any>view).onNavigatedTo))
                (<any>view).onNavigatedTo("forward");

            if (currentPage !== null && currentPage !== undefined)
                currentPage.view.onNavigatedFrom("forward");

            if ($.isFunction(onHtmlLoaded))
                onHtmlLoaded(view);

            return view;
        }, onDomUpdated);
    }

    isPageRestore = false;
    
    /**
     * Restores the page stack on the body element as frame. 
     */
    initializeFrame(frame: JQuery, viewName: string, parameters?: {}): Q.Promise<void>;
    initializeFrame(frame: JQuery, module: IModule, viewName: string, parameters?: {}): Q.Promise<void>;
    initializeFrame(frame: JQuery, a: any, b?: any, c?: any): Q.Promise<void> {
        if (typeof a === "string")
            return this.initializeFrameCore(frame, a, b);
        else
            return this.initializeFrameCore(frame, getViewName(a, b), c);
    }

    private initializeFrameCore(frame: JQuery, fullViewName: string, parameters?: {}) {
        return Q.Promise<void>((resolve, reject) => {
            if (this.frame !== null)
                throw new Error("The default frame is already initialized.");

            this.frame = frame;

            // CUSTOM
            var urlSegments = decodeURIComponent(window.location.hash).split("/");
            if (urlSegments.length > 1) {
                this.isPageRestore = true;
                this.showLoadingScreen(false);
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
                            this.navigateTo(fullViewName, { restoreQuery: restoreQuery }).then((view: ViewBase) => {
                                navigateToNextSegment(view);
                            }).done();
                        } else {
                            this.finishPageRestore(view);
                            resolve(null);
                        }
                    } else {
                        this.finishPageRestore(view);
                        resolve(null);
                    }
                };
                navigateToNextSegment(null);
            } else
                this.navigateTo(fullViewName, parameters).then(() => resolve(null), reject);
        });
    }

    private finishPageRestore(view: ViewBase) {
        this.hideLoadingScreen();
        this.isPageRestore = false;

        var page = this.getCurrentPageDescription();
        page.element.css("visibility", "");
        page.element.css("position", "");
    }

    /**
     * Navigates to a given page using in the default frame.
     */
    navigateTo(fullViewName: string, parameters?: {}): Q.Promise<PageBase>;
    navigateTo(modulePackage: IModule, viewName: string, parameters?: {}): Q.Promise<PageBase>;
    navigateTo(a: any, b: any, c?: any): Q.Promise<PageBase> {
        if (typeof a === "string")
            return <any>this.navigateToCore(a, b);
        else
            return <any>this.navigateToCore(getViewName(a, b), c);
    }

    private navigateToCore(fullViewName: string, parameters: {}): Q.Promise<ViewBase> {
        if (this.frame === null)
            throw "Frame is not set";

        if (this.isNavigating)
            throw "Already navigating";

        this.isNavigating = true;

        // append new invisible page to DOM
        var pageContainer = $(document.createElement("div"));
        //pageContainer.css("display", "table-cell"); // CUSTOM
        pageContainer.css("visibility", "hidden");
        pageContainer.css("position", "absolute");
        pageContainer.attr("visto-page", fullViewName);

        this.frame.append(pageContainer);

        // load currently visible page
        var currentPage = this.getCurrentPageDescription();

        this.showLoadingScreen(currentPage !== null);
        if (currentPage !== null && currentPage !== undefined) {
            return currentPage.view.onNavigatingFrom("forward").then<PageBase>((navigate) => {
                if (navigate) {
                    return this.tryNavigateForward(pageContainer, fullViewName, parameters, this.frame, undefined, (page) => {
                        this.hideLoadingScreen();
                        this.isNavigating = false;
                        return page;
                    });
                } else
                    this.isNavigating = false;
                return null;
            });
        } else {
            return this.tryNavigateForward(pageContainer, fullViewName, parameters, this.frame, undefined, (page) => {
                this.hideLoadingScreen();
                this.isNavigating = false;
                return page;
            });
        }
    }

    /**
     * Navigates back to the home page (first page in stack).
     */
    navigateHome(): Q.Promise<void> {
        if (this.navigationCount <= 1) {
            return Q<void>(null);
        } else {
            return this.navigateBack().then<void>(() => {
                return this.navigateHome();
            });
        }
    }

    /**
     * Navigates to the previous page.
     */
    navigateBack() {
        return Q.Promise<void>((resolve, reject) => {
            if (this.isNavigating)
                reject("Already navigating");
            else {
                this.backNavigationResolve = <any>resolve;
                this.backNavigationReject = reject;
                history.go(-1);
            }
        });
    }

    private backNavigationResolve: () => void = null;
    private backNavigationReject: (reason: any) => void = null;

    private onUrlChanged() {
        if (this.isNavigating)
            return; // TODO: What to do here? Go forward?

        var pageStack = this.getPageStack();
        if (pageStack.length > 1) {
            var currentPage = pageStack[pageStack.length - 1];
            if (currentPage !== null && currentPage !== undefined) {
                var count = 0, pos = 0;
                while ((pos = window.location.hash.indexOf("/", pos + 1)) !== -1)
                    count++;

                if (currentPage.hash !== count) {
                    this.currentNavigationPath = this.currentNavigationPath.substring(0, this.currentNavigationPath.lastIndexOf("/"));
                    this.isNavigating = true;
                    if (openedDialogs > 0)
                        this.tryNavigateBack(false, currentPage, pageStack);
                    else {
                        currentPage.view.onNavigatingFrom("back").then((navigate: boolean) => {
                            this.tryNavigateBack(navigate, currentPage, pageStack);
                        }).done();
                    }
                }
            }
        }
    }

    private tryNavigateBack(navigate: boolean, currentPage: IPage, pageStack: IPage[]) {
        if (navigate) {
            urlNavigationHistory.pop();
            this.navigationCount--;

            var previousPage = pageStack[pageStack.length - 2];
            currentPage.view.__destroyView();

            pageStack.pop();

            this.canNavigateBack(pageStack.length > 1);
            this.pageStackSize(pageStack.length);

            currentPage.element.remove();
            previousPage.element.css("visibility", "visible");
            previousPage.element.css("position", "");

            log("Navigated back to\n" +
                "  Page: " + previousPage.view.viewClass + "\n" +
                "  Page stack size: " + pageStack.length);

            previousPage.view.onNavigatedTo("back");
            currentPage.view.onNavigatedFrom("back");

            if ($.isFunction(this.backNavigationResolve))
                this.backNavigationResolve();
        } else {
            // CUSTOM
            if (this.frame !== null)
                (<any>window).location = "#" + currentPage.hash;

            if ($.isFunction(this.backNavigationReject))
                this.backNavigationReject("Cannot navigate back.");
        }

        this.isNavigating = false;

        this.backNavigationResolve = null;
        this.backNavigationReject = null;
    }
    
    // ----------------------------
    // Loading screen
    // ----------------------------

    initialLoadingScreenElement: JQuery = null;

    private loadingCount = 0;
    private currentLoadingScreenElement: JQuery = null;
    private loadingScreenElement = "<div class=\"loading-screen\"><img src=\"Content/Images/loading.gif\" class=\"loading-screen-image\" alt=\"Loading...\" /></div>"; 

    /**
     * Shows the loading screen. Always call hideLoadingScreen() for each showLoadingScreen() call. 
     */
    showLoadingScreen(delayed?: boolean) {
        if (this.loadingCount === 0) {
            if (delayed == undefined || delayed) {
                setTimeout(() => {
                    if (this.loadingCount > 0)
                        this.appendLoadingElement();
                }, loadingScreenDelay);
            } else
                this.appendLoadingElement();
        }

        this.loadingCount++;
    }

    private appendLoadingElement() {
        if (this.initialLoadingScreenElement !== null) {
            this.initialLoadingScreenElement.remove();
            this.initialLoadingScreenElement = null;
        }

        if (this.currentLoadingScreenElement === null) {
            this.currentLoadingScreenElement = $(this.loadingScreenElement);
            $("body").append(this.currentLoadingScreenElement);
        }
    }

    /**
     * Hides the loading screen. 
     */
    hideLoadingScreen() {
        this.loadingCount--;
        if (this.loadingCount === 0) {
            if (this.currentLoadingScreenElement !== null) {
                this.currentLoadingScreenElement.remove();
                this.currentLoadingScreenElement = null;
            }
        }
    }
}

export enum DialogResult {
    Undefined,
    Ok,
    Cancel,
    Yes,
    No,
}

// Public
export var loadingScreenDelay = 300;
export var isLogging = true;

// Variables
var views: { [a: string]: ViewBase } = {};
var viewCount = 0;
var openedDialogs = 0;

// Local variables
var tagAliases: { [key: string]: any } = {};

// ----------------------------
// Tag aliases
// ----------------------------

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
        console.log(new Date().toLocaleTimeString() + ": " + value);
};

// Tries to load a module using RequireJS
function tryRequire(moduleName: string) {
    return Q.Promise<any>(resolve => {
        require([moduleName], (module: any) => { resolve(module); }, () => { resolve(null); });
    });
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

var remotePaths: { [packageName: string]: string } = {};

export function registerRemotePath(path: string, remoteUrl: string) {
    if (remotePaths[path.toLowerCase()] !== undefined)
        throw new Error("The remote path '" + path + "' is already registered.");

    remotePaths[path.toLowerCase()] = remoteUrl;
}

function getRemotePathBaseUrl(path: string) {
    return remotePaths[path.toLowerCase()] !== undefined ? remotePaths[path.toLowerCase()] + "/" : "";
}

// Replace original RequireJS require function to fix remote dependency loading
declare var define: any;
var originalDefine = define;
define = <any>((modules: string[], success: (...modules: any[]) => void, failed?: () => void) => {
    if ($.isArray(modules)) {
        for (var path in remotePaths) {
            if (remotePaths.hasOwnProperty(path)) {
                $.each(modules, (index, module) => {
                    if (module.toLowerCase().indexOf(path + "/") === 0)
                        modules[index] = remotePaths[path] + "/Scripts/" + module + ".js";
                });
            }
        }
    }

    originalDefine(modules, success, failed);
});

// ----------------------------
// Package management
// ----------------------------

function getChildPackage(parentView: ViewBase, fallbackPackage: string) {
    if (parentView.inheritPackageFromParent) {
        var parent = parentView.viewParent;
        while (parent !== undefined && parent !== null && parent.inheritPackageFromParent)
            parent = parent.viewParent;
        return parent !== undefined && parent !== null ? parent.viewPackage : fallbackPackage;
    }
    else
        return parentView.viewPackage;
}

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
    var modulePath = "/" + module.id.replace("//Scripts/", "").replace("/Scripts/", "");

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
 * Gets the view or parent view of the given element.
 */
export function getViewFromElement(element: Node): ViewBase {
    var context = ko.contextFor(element);
    if (context !== undefined && context !== null && context.$parent !== undefined && context.$parent !== null)
        return context.$parent.view;
    return null;
};

/**
 * Gets the parent view of the given element.
 */
export function getParentViewFromElement(element: Node): ViewBase {
    var parent = element.parentNode;
    if (parent !== undefined && parent !== null) {
        var context = ko.contextFor(parent);
        if (context !== undefined && context !== null && context.$parent !== undefined && context.$parent !== null)
            return context.$parent.view;
    }
    return null;
};

/**
 * Gets the parent view model of the given element.
 */
export function getViewModelForElement(element: JQuery): ViewModel {
    var view = <View<any>>getViewFromElement(element.get(0));
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
    if (currentViewContext === null) // already in DOM
        completed();
    else
        currentViewContext.initializers.push(completed);
};

//Register callback when user manually navigates back (back key)
(<any>$(window)).hashchange(() => {
    if (urlNavigationHistory.length > 1) {
        var context = urlNavigationHistory[urlNavigationHistory.length - 1];
        (<any>context).onUrlChanged();
    }
});

// ----------------------------
// Dialogs
// ----------------------------

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
    init() {
        return { controlsDescendantBindings: true };
    },

    update(elem: any, valueAccessor: any): void {
        var value = <any>ko.utils.unwrapObservable(valueAccessor());
        var viewName = value.name;

        // destroy if view is already loaded and only viewName has changed
        var view = elem.vistoView;
        if (view !== undefined && view !== null) {
            if (view.viewName === viewName || view.viewName === view.viewPackage + ":" + viewName)
                return; // only rebuild when viewName changed
            
            log("Refreshing view: \n" +
                "  Old view: " + view.viewName + "\n" +
                "  New view '" + viewName + "\n" +
                "  View ID: " + view.viewId);

            view.__destroyView();
        }

        var last: any = null;
        var first: any = ko.virtualElements.firstChild(elem);
        var child = first;
        while (child) {
            last = child;
            child = ko.virtualElements.nextSibling(child);
        }

        var html = "";
        var isf = false;
        for (var i = 0; i < elem.parentNode.childNodes.length; i++) {
            var node = elem.parentNode.childNodes[i];
            if (node === first)
                isf = true;

            if (isf) {
                var wrap = document.createElement('div');
                wrap.appendChild(node.cloneNode(true));
                html += wrap.innerHTML; 

                //if (node.outerHTML !== undefined)
                //    html += node.outerHTML;
                //else if (node.text !== undefined)
                //    html += node.text;
                //else if (node.data !== undefined)
                //    html += node.data;
            }

            if (node === last)
                break;
        }

        ko.virtualElements.emptyNode(elem);

        value.__htmlBody = html;

        var element = $("<div></div>");

        var parentView = getParentViewFromElement(elem);
        var context = parentView != null ? parentView.context : currentContext;

        if (context === null)
            throw "Could not find Visto context.";

        var factory = new ViewFactory();
        factory.create($(element), viewName, value, context, view => {
            elem.vistoView = view;

            ko.utils.domNodeDisposal.addDisposeCallback(elem, () => {
                view.__destroyView();
            });

            if (parentView !== null)
                parentView.__addSubView(view);

            view.__setHtml = false;
        }, (view) => {
            ko.virtualElements.setDomNodeChildren(elem, view.elementNodes);
        }).done();
    }
};

ko.virtualElements.allowedBindings["view"] = true;

// ----------------------------
// View model
// ----------------------------

export class ViewModel {
    /**
     * Gets the parameters provided by the creator of the view (e.g. attributes on the custom tag). 
     */
    parameters: Parameters;

    context: VistoContext = null;

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
        return this.view.context.getObservableString(key, this.view.viewPackage)();
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
     * Gets the element container which contains the view HTML markup (not available in ctor, initialize() and onLoading()). 
     */
    elementNodes: Node[] = null; 

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

    /**
     * Gets or sets a value indicating whether the view should use the view model of the parent view and thus no own view model is instantiated. 
     * The property must be set in the view's initialize() method. 
     * The view cannot have an own view model class. 
     */
    inheritViewModelFromParent() {
        (<any>this).viewModel = (<any>this.viewParent).viewModel;
    }

    /**
     * Gets or sets a value indicating whether the package scope for child views is inherited from the parent view. 
     * The property must be set in the view's initialize() method. 
     */
    inheritPackageFromParent = false;

    private isDestroyed = false;
    private subViews: ViewBase[] = <Array<any>>[];
    private disposables: IDisposable[] = <Array<any>>[];

    context: VistoContext = null; 
    
    /**
     * Enables page restoring for the current page. 
     * This method must be called in the initialize() method. 
     * Page restore only works for a page if all previous pages in the page stack support page restore.
     */
    enablePageRestore(restoreQuery?: string) {
        (<any>this).viewModel.enablePageRestore(restoreQuery);
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
        return this.context.getString(key, this.viewPackage);
    }

    /**
     * Finds elements inside this view with a selector. 
     */
    findElements(selector: string) {
        if (this.elementNodes.length === 0)
            return $();

        return $(this.elementNodes[0].parentNode).find(selector); // TODO: Only children and subchildren
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
            log("Destroying view\n" +
                "  View: " + this.viewId + "' (" + this.viewClass + ")\n" +
                "  # of subviews: " + this.subViews.length);

            delete views[this.viewId];

            (<any>this).viewModel.destroy();
            this.destroy();

            $.each(this.disposables, (index: number, item: IDisposable) => {
                item.dispose();
            });

            if (this.viewParent != null)
                this.viewParent.viewChildren.remove(this);

            this.isDestroyed = true;

            for (var j = 0; j < this.elementNodes.length; j++)
                ko.cleanNode(<any>this.elementNodes[j]); // unapply bindings
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

    __setHtml: boolean = true;

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
    dialogElement: JQuery;

    /**
     * Gets the dialog result. 
     */
    result = DialogResult.Undefined;

    /**
     * Closes the dialog. 
     */
    close(result?: DialogResult) {
        this.result = result;
        closeNativeDialog(this.dialogElement);
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

    constructor(fullViewName: string, parameters: any) {
        if (parameters === undefined || parameters === null)
            parameters = {};

        this.fullViewName = fullViewName;
        this.originalParameters = parameters;

        this.tagContentHtml = parameters.__htmlBody !== undefined ? parameters.__htmlBody : "";
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
        return func; 

        // TODO: Fix this
        //return function () {
        //    if (func.caller !== undefined && func.caller !== null)
        //        return func;

        //    var parentElement = (<any>viewModel).view.element.parent()[0];
        //    var parentViewModel = ko.contextFor(parentElement).$data;
        //    return func.apply(parentViewModel, arguments);
        //};
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
            object["htmlElement"] = element;
            $.each(element.get(0).attributes, (index: number, attr: Attr) => {
                object[convertDashedToCamelCase(attr.name)] = attr.value;
            });
            return object;
        }
    }
}

// ----------------------------
// View factory
// ----------------------------

export class ResourceManager {
    loadedViews: { [key: string]: Q.Promise<string> } = <any>([]);

    getViewModules(packageName: string, viewName: string): Q.Promise<{ viewModule: any; viewModelModule: any }> {
        var viewModule: any = null;
        var viewModelModule: any = null;

        var viewUrl = this.getViewModuleUrl(packageName, viewName);
        var viewModelUrl = this.getViewModelModuleUrl(packageName, viewName);

        var baseUrl = getRemotePathBaseUrl(packageName);
        if (baseUrl !== "") {
            viewUrl = baseUrl + viewUrl;
            viewModelUrl = baseUrl + viewModelUrl;
        }

        var promises = [
            tryRequire(viewUrl).then((m: any) => {
                viewModule = m;
            }),
            tryRequire(viewModelUrl).then((m: any) => {
                viewModelModule = m;
            })
        ];

        return Q.all(promises).then(() => {
            return {
                'viewModule': viewModule,
                'viewModelModule': viewModelModule,
            };
        });
    }

    getViewModuleUrl(packageName: string, viewName: string) {
        return packageName + "/views/" + viewName;
    }

    getViewModelModuleUrl(packageName: string, viewName: string) {
        return packageName + "/viewModels/" + viewName + "Model";
    }
    
    /**
     * [Replaceable] Loads the translated string for a given package and language. 
     */
    getLanguageStrings(packageName: string, lang: string) {
        var url = getRemotePathBaseUrl(packageName) + "Scripts/" + packageName + "/languages/" + lang + ".json";
        return Q($.ajax({
            url: url,
            type: "get",
            dataType: "json",
            global: false
        })).then((result: { [key: string]: string }) => {
            return result;
        }).catch(reason => {
            log("Error loading language strings '" + url + "' (" + reason + " )");
            return <{ [key: string]: string }>{};
        });
    }

    getViewHtml(packageName: string, viewName: string) {
        var name = packageName + ":" + viewName;

        var hasPromise = this.loadedViews[name] !== undefined;
        if (!hasPromise) {
            var baseUrl = getRemotePathBaseUrl(packageName);
            this.loadedViews[name] = Q($.ajax({
                url: baseUrl + "Scripts/" + packageName + "/views/" + viewName + ".html",
                dataType: "html",
                global: false
            })).then((data: string) => {
                data = this.processCustomTags(data);
                data = this.processKnockoutAttributes(data);
                return data;
            }).catch(() => {
                return "<span>[View '" + name + "' not found]</span>";
            });
        }

        return this.loadedViews[name];
    }

    /**
     * Process custom tags in the given HTML data string.
     */
    protected processCustomTags(data: string) {
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
                        htmlAttributes += " " + match; // TODO: Why?
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

                return '<!-- ko view: { ' + bindings + ' } -->' + htmlAttributes + (tagClosing === "/>" ? "<!-- /ko -->" : "");
                //return '<span data-bind="view: { ' + bindings + ' }" ' + htmlAttributes + tagClosing;
            });

        data = data.replace(/<\/vs-([a-zA-Z0-9-]+?)>/g, "<!-- /ko -->");
        return data;
    }

    /**
     * Process Knockout attributes (vs-) in the given HTML data string (must be called after processCustomTags).
     */
    protected processKnockoutAttributes(data: string) {
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
}

export class BundledResourceManager extends ResourceManager {
    loadBundles = true;

    loadPackageBundle(packageName: string): Q.Promise<any> {
        var bundleModule = packageName + "/package";

        var fullBundleModule = bundleModule;
        var baseUrl = getRemotePathBaseUrl(packageName);
        if (baseUrl !== "")
            fullBundleModule = baseUrl + "Scripts/" + bundleModule + ".js";

        return tryRequire(fullBundleModule).then((bundle: any) => {
            if (bundle === undefined && baseUrl !== "") {
                return tryRequire(bundleModule);
            } else
                return bundle;
        });
    }

    getViewModules(packageName: string, viewName: string): Q.Promise<{ viewModule: any; viewModelModule: any }> {
        if (!this.loadBundles)
            return super.getViewModules(packageName, viewName);

        var viewUrl = packageName + "/views/" + viewName;
        var viewModelUrl = packageName + "/viewModels/" + viewName + "Model";

        return this.loadPackageBundle(packageName).then((bundle) => {
            if (bundle !== undefined && bundle !== null && bundle.views[viewName] !== undefined) {
                var viewModule: any = null;
                var viewModelModule: any = null;
                var promises: any = [];

                var view = bundle.views[viewName];
                if (view.hasView) {
                    promises.push(tryRequire(viewUrl).then((m: any) => {
                        viewModule = m;
                    }));
                }

                if (view.hasViewModel) {
                    promises.push(tryRequire(viewModelUrl).then((m: any) => {
                        viewModelModule = m;
                    }));
                }

                return Q.all(promises).then(() => {
                    return {
                        'viewModule': viewModule,
                        'viewModelModule': viewModelModule,
                    };
                });
            }
            else
                return super.getViewModules(packageName, viewName);
        });
    }

    getViewHtml(packageName: string, viewName: string) {
        if (!this.loadBundles)
            return super.getViewHtml(packageName, viewName);

        return <Q.Promise<string>>this.loadPackageBundle(packageName).then((bundle: any) => {
            if (bundle !== null && bundle !== undefined && bundle.views[viewName] !== undefined) {
                var html = bundle.views[viewName].html;
                html = this.processCustomTags(html);
                return this.processKnockoutAttributes(html);
            } else
                return super.getViewHtml(packageName, viewName);
        });
    }
}

class ViewFactory {
    private element: JQuery;
    private containerElement: JQuery;
    private parameters: Parameters;

    private viewId: string;
    private viewModule: any;
    private viewModelModule: any;
    private viewLocator: ViewLocator;

    private isRootView: boolean;

    private context: VistoContext;
    private viewContext: ViewFactoryContext;

    view: ViewBase;
    viewModel: ViewModel;

    viewParent: ViewBase;

    create(element: JQuery, fullViewName: string, parameters: any, context: VistoContext,
        onHtmlLoaded?: (view: ViewBase) => void, onDomUpdated?: (view: ViewBase) => void) {

        this.element = element;
        this.context = context;

        if (currentViewContext === undefined || currentViewContext === null) {
            // from foreach, other late-bindings or root view
            this.viewContext = new ViewFactoryContext();
            this.viewContext.viewParent = getParentViewFromElement(element.get(0));
            this.isRootView = true;
        } else {
            this.viewContext = currentViewContext;
            this.isRootView = false;
        }

        this.viewParent = this.viewContext.viewParent;
        this.viewLocator = new ViewLocator(fullViewName, this.viewContext);
        this.parameters = new Parameters(fullViewName, parameters);
        element.html("");

        var lazySubviewLoading = this.parameters.getBoolean(lazyViewLoadingOption, false);
        if (!lazySubviewLoading)
            this.viewContext.viewCount++;

        var moduleLoader: any = context.resourceManager.getViewModules(this.viewLocator.package, this.viewLocator.view);
        var languageLoader: any = context.loadLanguageStrings(this.viewLocator.package);

        return Q.all([moduleLoader, languageLoader]).spread((modules: { viewModule: any; viewModelModule: any }) => {
            this.viewModule = modules.viewModule;
            this.viewModelModule = modules.viewModelModule;
            return context.resourceManager.getViewHtml(this.viewLocator.package, this.viewLocator.view);
        }).then((data: string) => {
            return this.loadHtml(data, context, onHtmlLoaded, onDomUpdated);
        }).then((view) => {
            return view;
        });
    }

    private loadHtml(htmlData: string, context: VistoContext, onHtmlLoaded: (view: ViewBase) => void, onDomUpdated: (view: ViewBase) => void) {
        this.viewId = "view_" + ++viewCount;

        htmlData = htmlData
            .replace(/vs-id="/g, "id=\"" + this.viewId + "_")
            .replace(/\[\[viewid\]\]/gi, this.viewId);

        var container = $(document.createElement("div"));
        container.html(htmlData);

        this.containerElement = container;

        this.view = this.instantiateView();
        this.viewModel = this.instantiateViewModel(this.view);

        this.view.context = context;
        this.viewModel.context = context; 

        // initialize and retrieve restore query
        this.view.initialize(this.parameters);
        this.viewModel.initialize(this.parameters);
        this.viewModel = (<any>this.view).viewModel; // may have changed in view.initialize()

        if (this.isRootView)
            this.viewContext.restoreQuery = this.parameters.getRestoreQuery();

        var lazySubviewLoading = this.parameters.getBoolean(lazyViewLoadingOption, false);
        if (lazySubviewLoading) {
            this.__setHtml();
            this.applyBindings();
            this.__raiseLoadedEvents();

            return Q(this.view);
        } else {
            this.viewContext.factories.push(this);

            this.viewContext.viewParent = this.view;
            this.viewContext.parentPackage = this.viewLocator.package;

            try {
                currentContext = context;
                currentViewContext = this.viewContext;
                this.applyBindings();
            } finally {
                currentViewContext = null;
                currentContext = null;
            }

            if ($.isFunction(onHtmlLoaded))
                onHtmlLoaded(this.view);

            return this.viewContext.finalizeView(this.view, onDomUpdated).then(() => {
                return this.view;
            });
        }
    }

    private applyBindings() {
        try {
            log("Apply bindings: \n" +
                "  View: " + this.view.viewName + " (parent: " + (this.view.viewParent != null ? this.view.viewParent.viewName : "n/a") + ")\n" +
                "  View Model: " + (<any>this.viewModel).view.viewName);

            ko.applyBindings(this.viewModel, this.containerElement.get(0));
        } catch (err) {
            console.error("Error applying bindings: \n" +
                "  View: " + this.view.viewName + "'\n" +
                "  View Model: " + (<any>this.viewModel).view.viewName + "'\n" +
                "  View ID: " + this.viewId + "\n" +
                "  Check if view model could be loaded and bound property/expression is available/correct\n" +
                err.stack + "\nBound HTML:");

            console.warn(this.containerElement.get(0).innerHTML);
            throw err;
        }
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

        var childNodesCopy: Node[] = [];
        var childNodes = this.containerElement.get(0).childNodes;
        for (var j = 0; j < childNodes.length; j++)
            childNodesCopy.push(childNodes[j]);

        view.elementNodes = childNodesCopy;
        view.viewId = this.viewId;

        view.viewName = this.viewLocator.name;
        view.viewClass = this.viewLocator.className;
        view.viewPackage = this.viewLocator.package;

        view.parameters = this.parameters;
        view.__setViewParent(this.viewParent);

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

    // ReSharper disable InconsistentNaming

    __raiseLoadedEvents() {
        this.view.onLoaded();
        this.viewModel.onLoaded();

        this.view.isViewLoaded(true);
    }

    __setHtml() {
        if (this.view.__setHtml) {
            this.element.empty();

            for (var i = 0; i < this.view.elementNodes.length; i++) {
                var child = this.view.elementNodes[i];
                this.element.get(0).appendChild(child);
            }
        }
    }

    // ReSharper restore InconsistentNaming
}

class ViewFactoryContext {
    factories: ViewFactory[] = <Array<any>>[];
    initializers: (() => void)[] = <Array<any>>[];

    parentPackage = defaultPackage;
    viewParent: ViewBase = null;

    viewCount = 0;
    restoreQuery: string = undefined;
    loadedViewCount = 0;

    finalizeView(view: ViewBase, onDomUpdated?: (view: ViewBase) => void) {
        // TODO: Refactor this!
        return Q.Promise<ViewFactoryContext>((resolve, reject) => {
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

                                        if ($.isFunction(onDomUpdated))
                                            onDomUpdated(view);

                                        $.each(this.factories, (index: number, factory: ViewFactory) => {
                                            factory.__raiseLoadedEvents();
                                        });

                                        // TODO: Should be called first
                                        $.each(this.initializers, (index: number, initializer: () => void) => {
                                            initializer();
                                        });

                                        resolve(this);
                                    } else {
                                        this.initializers.push(() => {
                                            if ($.isFunction(onDomUpdated))
                                                onDomUpdated(view);
                                            resolve(this);
                                        });
                                    }
                                }).done();
                            });
                        } else {
                            this.initializers.push(() => {
                                if ($.isFunction(onDomUpdated))
                                    onDomUpdated(view);
                                resolve(this);
                            });
                        }
                    }).done();
                });
            } else {
                this.initializers.push(() => {
                    if ($.isFunction(onDomUpdated))
                        onDomUpdated(view);
                    resolve(this);
                });
            }
        });
    }
}

class ViewLocator {
    package: string;
    view: string;
    name: string;
    className: string;

    constructor(fullViewName: string, context: ViewFactoryContext) {
        if (fullViewName.indexOf(":") !== -1) {
            var arr = fullViewName.split(":");
            this.package = getPackageName(arr[0]);
            this.view = arr[1];
        } else {
            if (context.viewParent != null)
                this.package = getChildPackage(context.viewParent, context.parentPackage);
            else
                this.package = context.parentPackage;

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

export interface IPage {
    view: PageBase;
    hash: number;
    element: JQuery;
}

export interface IDisposable {
    dispose(): void;
}

export interface IVisto {
    navigateBack(): Q.Promise<void>;
}
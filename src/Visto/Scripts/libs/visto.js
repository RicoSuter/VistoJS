// Visto JavaScript Framework (VistoJS) v2.1.0
// (c) Rico Suter - http://visto.codeplex.com/
// License: Microsoft Public License (Ms-PL) (https://visto.codeplex.com/license)
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "libs/hashchange"], function (require, exports, __hashchange) {
    /// <reference path="q.d.ts" />
    /// <reference path="knockout.d.ts" />
    /// <reference path="jquery.d.ts" />
    /// <reference path="visto.modules.d.ts" />
    exports.__hashchange = __hashchange;
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
    exports.loadingScreenDelay = 300;
    exports.isLogging = true;
    exports.canNavigateBack = ko.observable(false);
    exports.pageStackSize = ko.observable(0);
    // Variables
    var views = {};
    var viewCount = 0;
    var navigationCount = 0;
    var navigationHistory = new Array();
    var loadedViews = ([]);
    var isNavigating = false;
    var openedDialogs = 0;
    // Internationalization variables
    exports.language = ko.observable(null);
    exports.supportedLanguages = [];
    var previousLanguage = null;
    var languageStrings = ([]);
    // Local variables
    var currentNavigationPath = "";
    var currentContext = null;
    var defaultFrame = null;
    var initialLoadingScreenElement = null;
    var tagAliases = {};
    // Globals for bindings
    var globals = {
        navigateBack: function () { return navigateBack(); },
        navigateHome: function () { return navigateHome(); },
        canNavigateBack: exports.canNavigateBack,
        pageStackSize: exports.pageStackSize
    };
    // ----------------------------
    // Initializer
    // ----------------------------
    /**
     * Initializes the framework and navigates to the first page or restores the pages.
     */
    function initialize(options) {
        defaultPackage = options.defaultPackage === undefined ? defaultPackage : options.defaultPackage;
        initialLoadingScreenElement = options.initialLoadingScreenElement === undefined ? $("body").find("div") : options.initialLoadingScreenElement;
        setUserLanguage(options.supportedLanguages);
        if (options.registerEnterKeyFix === undefined || options.registerEnterKeyFix) {
            $(document).bind("keypress", function (ev) {
                if (ev.keyCode === 13 && ev.target.localName === "input")
                    ev.preventDefault();
            });
        }
        createView($("body").append("<div></div>"), options.startView, options.startParameters);
    }
    exports.initialize = initialize;
    /**
     * Registers an alias for a tag; specify the tag without 'vs-'.
     */
    function registerTagAlias(tag, pkg, viewPath) {
        if (tagAliases[tag] !== undefined)
            throw new Error("The tag alias '" + tag + "' is already registered.");
        if (typeof pkg === "string")
            tagAliases[tag] = pkg + ":" + viewPath;
        else
            tagAliases[tag] = getPackageNameForModule(pkg) + ":" + viewPath;
    }
    exports.registerTagAlias = registerTagAlias;
    // ----------------------------
    // Internal helper methods
    // ----------------------------
    // Logs the string to the console if logging is enabled
    function log(value) {
        if (exports.isLogging)
            console.log(value);
    }
    ;
    // Tries to load a module using RequireJS
    function tryRequire(moduleNames, completed) {
        require(moduleNames, function (result) { completed(result); }, function () { completed(null); });
    }
    ;
    // Checks whether a string ends with a given suffix
    function endsWith(data, suffix) {
        return data.indexOf(suffix, data.length - suffix.length) !== -1;
    }
    ;
    // Checks whether a string starts with a given prefix
    function startsWith(data, prefix) {
        return data.indexOf(prefix) === 0;
    }
    ;
    // Converts a dashed string ('my-string') into a camel case string (myString)
    function convertDashedToCamelCase(data) {
        return data.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
    }
    // ----------------------------
    // Internationalization
    // ----------------------------
    // Contains the completion callbacks for language urls
    var languageLoadings = ([]);
    /**
     * Gets the package name of the given path.
     */
    function getPackageName(path) {
        if (path === undefined || path === null)
            return defaultPackage;
        if (path[path.length - 1] !== "/")
            return path;
        return path;
    }
    ;
    /**
     * Gets the package name where the given module is located.
     */
    function getPackageNameForModule(module) {
        var modulePath = "/" + module.id;
        var index = modulePath.lastIndexOf("/views/");
        if (index === -1)
            index = modulePath.lastIndexOf("/viewModels/");
        if (index === -1)
            index = modulePath.lastIndexOf("/");
        return index === -1 ? defaultPackage : modulePath.substr(1, index - 1);
    }
    exports.getPackageNameForModule = getPackageNameForModule;
    /**
     * Gets the full view name for the view from the given module and path.
     */
    function getViewName(module, viewPath) {
        return getPackageNameForModule(module) + ":" + viewPath;
    }
    exports.getViewName = getViewName;
    /**
     * Loads the language file for the given package and current language.
     */
    function loadLanguageFile(packageName, completed) {
        var lang = exports.language();
        if (languageStrings[lang] === undefined)
            languageStrings[lang] = ([]);
        if (languageStrings[lang][packageName] === undefined) {
            // TODO avoid multiple simultaneous loadings
            var url = "Scripts/" + packageName + "/languages/" + lang + ".json";
            if (languageLoadings[url] === undefined) {
                languageLoadings[url] = [completed];
                $.ajax({
                    url: url,
                    type: "get",
                    dataType: "json"
                }).done(function (result) {
                    languageStrings[lang][packageName] = result;
                    $.each(languageLoadings[url], function (index, item) { item(); });
                    delete languageLoadings[url];
                }).fail(function (xhr, ajaxOptions) {
                    languageStrings[lang][packageName] = ([]);
                    $.each(languageLoadings[url], function (index, item) { item(); });
                    log("Error loading language JSON '" + url + "': " + ajaxOptions);
                    delete languageLoadings[url];
                });
            }
            else
                languageLoadings[url].push(completed);
        }
        else
            completed();
    }
    ;
    /**
     * Loads a translated string.
     */
    function getString(key, packageName, completed) {
        packageName = getPackageName(packageName);
        var lang = exports.language();
        if (languageStrings[lang] === undefined)
            languageStrings[lang] = ([]);
        if (languageStrings[lang][packageName] === undefined) {
            loadLanguageFile(packageName, function () { getStringForLanguage(lang, packageName, key, completed); });
            if (previousLanguage !== null)
                return getStringForLanguage(previousLanguage, packageName, key);
            return "";
        }
        else
            return getStringForLanguage(lang, packageName, key, completed);
    }
    ;
    /**
     * Loads a translated string as observable object which updates when the language changes.
     */
    function getObservableString(key, packageName) {
        var observable = ko.observable();
        observable(getString(key, packageName, function (value) { observable(value); }));
        return observable;
    }
    exports.getObservableString = getObservableString;
    ;
    /**
     * Loads a translated string for a given language.
     */
    function getStringForLanguage(lang, packageName, key, completed) {
        var value = languageStrings[lang][packageName][key];
        if (value === undefined)
            value = packageName + ":" + key;
        if (completed !== undefined)
            completed(value);
        return value;
    }
    ;
    /**
     * Sets the language of the application.
     */
    function setLanguage(lang, supportedLangs, updateBindings) {
        if (exports.language() !== lang) {
            previousLanguage = exports.language();
            exports.language(lang);
            if (supportedLangs !== null && supportedLangs !== undefined)
                exports.supportedLanguages = supportedLangs;
            if (updateBindings === null || updateBindings === undefined || updateBindings)
                replaceLanguageStrings($('body > *'));
        }
    }
    exports.setLanguage = setLanguage;
    ;
    /**
     * Sets the language to the user preferred language.
     */
    function setUserLanguage(supportedLangs, updateBindings) {
        var newLanguage;
        if (navigator.userLanguage !== undefined)
            newLanguage = navigator.userLanguage.split("-")[0];
        else
            newLanguage = navigator.language.split("-")[0];
        if ($.inArray(newLanguage, exports.supportedLanguages))
            setLanguage(newLanguage, supportedLangs, updateBindings);
        else
            setLanguage(supportedLangs[0], supportedLangs, updateBindings);
    }
    exports.setUserLanguage = setUserLanguage;
    ;
    /**
     * Updates all translated strings of an HTML element and its children.
     */
    function replaceLanguageStrings(element, path) {
        var findRootPath = path === undefined;
        element.find("[data-translate]").each(function () {
            var self = $(this);
            if (findRootPath)
                path = self.attr("data-translate-root");
            else
                self.attr("data-translate-root", path); // used for language refreshes... 
            getString(self.attr("data-translate"), path, function (content) {
                self.html(content);
            });
        });
    }
    ;
    // ----------------------------
    // Views
    // ----------------------------
    /**
     * Gets the parent view of the given element.
     */
    function getViewFromElement(element) {
        while ((element = element.parent()) != undefined) {
            if (element.length === 0)
                return null;
            var viewId = $(element[0]).attr(viewIdAttribute);
            if (viewId !== undefined)
                return views[viewId];
        }
        return null;
    }
    exports.getViewFromElement = getViewFromElement;
    ;
    /**
     * Registers an initializer which is called after the elements of the context are added to the DOM.
     * This is used for custom ko bindings so that they work correctly if they assume that an element is already in the DOM.
     * Call this in custom ko bindings to run code after element has been added to the DOM.
     */
    function addInitializer(completed) {
        if (currentContext === null)
            completed();
        else
            currentContext.initializers.push(completed);
    }
    exports.addInitializer = addInitializer;
    ;
    function initializeDefaultFrame(frame, a, b, c) {
        if (typeof a === "string")
            return initializeDefaultFrameCore(frame, a, b);
        else
            return initializeDefaultFrameCore(frame, getViewName(a, b), c);
    }
    exports.initializeDefaultFrame = initializeDefaultFrame;
    function initializeDefaultFrameCore(frame, fullViewName, parameters) {
        if (defaultFrame !== null)
            throw new Error("The default frame is already initialized.");
        defaultFrame = frame;
        return Q.Promise(function (resolve, reject) {
            var urlSegments = decodeURIComponent(window.location.hash).split("/");
            if (urlSegments.length > 1) {
                exports.isPageRestore = true;
                showLoadingScreen(false);
                var currentSegmentIndex = 1;
                var navigateToNextSegment = function (view) {
                    var segment = urlSegments[currentSegmentIndex];
                    if (segment != null) {
                        var segmentParts = segment.split(":");
                        var supportsPageRestore = segmentParts.length === 3;
                        if (supportsPageRestore) {
                            currentSegmentIndex++;
                            var fullViewName = segmentParts[0] + ":" + segmentParts[1];
                            var restoreQuery = segmentParts.length === 3 ? segmentParts[2] : undefined;
                            navigateTo(frame, fullViewName, { restoreQuery: restoreQuery }).then(function (view) {
                                navigateToNextSegment(view);
                            }).done();
                        }
                        else
                            finishPageRestore(frame, view, resolve);
                    }
                    else
                        finishPageRestore(frame, view, resolve);
                };
                navigateToNextSegment(null);
            }
            else {
                navigateTo(frame, fullViewName, parameters)
                    .then(function (view) { return resolve(view); })
                    .fail(reject);
            }
        });
    }
    ;
    exports.isPageRestore = false;
    function finishPageRestore(frame, view, completed) {
        hideLoadingScreen();
        exports.isPageRestore = false;
        var page = getCurrentPageDescription(frame);
        page.element.removeAttr("style");
        completed(view);
    }
    function navigateTo(a, b, c) {
        if (typeof a === "string")
            return navigateToCore(defaultFrame, a, b);
        else if (a.uri !== undefined)
            return navigateToCore(defaultFrame, getViewName(a, b), c);
        else
            return navigateToCore(a, b, c);
    }
    exports.navigateTo = navigateTo;
    function navigateToCore(frame, fullViewName, parameters) {
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
                .then(function (navigate) { return tryNavigateForward(fullViewName, parameters, frame, pageContainer, navigate); })
                .then(function (page) {
                hideLoadingScreen();
                return page;
            });
        }
        else {
            return tryNavigateForward(fullViewName, parameters, frame, pageContainer, true).then(function (page) {
                hideLoadingScreen();
                return page;
            });
        }
    }
    /**
     * Navigates back to the home page (first page in stack).
     */
    function navigateHome() {
        if (navigationCount <= 1) {
            return Q(null);
        }
        else {
            return navigateBack().then(function () {
                return navigateHome();
            });
        }
    }
    exports.navigateHome = navigateHome;
    /**
     * Navigates to the previous page.
     */
    function navigateBack() {
        return Q.Promise(function (resolve, reject) {
            if (isNavigating)
                reject("Already navigating");
            else {
                backNavigationResolve = resolve;
                backNavigationReject = reject;
                history.go(-1);
            }
        });
    }
    exports.navigateBack = navigateBack;
    var backNavigationResolve = null;
    var backNavigationReject = null;
    function tryNavigateBack(navigate, currentPage, pageStack) {
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
        }
        else {
            window.location = "#" + currentPage.hash;
            if ($.isFunction(backNavigationReject))
                backNavigationReject("Cannot navigate back.");
        }
        isNavigating = false;
        backNavigationResolve = null;
        backNavigationReject = null;
    }
    // Register callback when user manually navigates back (back key)
    $(window).hashchange(function () {
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
                            currentPage.view.onNavigatingFrom("back").then(function (navigate) {
                                tryNavigateBack(navigate, currentPage, pageStack);
                            }).done();
                        }
                    }
                }
            }
        }
    });
    function showDialog(a, b, c, d) {
        if (typeof a === "string")
            return showDialogCore(a, b, c);
        else
            return showDialogCore(getViewName(a, b), c, d);
    }
    exports.showDialog = showDialog;
    function showDialogCore(fullViewName, parameters, onLoaded) {
        return Q.Promise(function (resolve, reject) {
            var container = $("<div style=\"display:none\" />");
            $("body").append(container);
            if (parameters === undefined)
                parameters = {};
            parameters[isDialogParameter] = true;
            showLoadingScreen();
            createView(container, fullViewName, parameters).then(function (view) {
                openedDialogs++;
                // Remove focus from element of the underlying page to avoid click events on enter press
                var focusable = $("a,frame,iframe,label,input,select,textarea,button:first");
                if (focusable != null) {
                    focusable.focus();
                    focusable.blur();
                }
                showNativeDialog($(container.children().get(0)), view, parameters, function () { view.onShown(); }, function () {
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
    (function (DialogResult) {
        DialogResult[DialogResult["Undefined"] = 0] = "Undefined";
        DialogResult[DialogResult["Ok"] = 1] = "Ok";
        DialogResult[DialogResult["Cancel"] = 2] = "Cancel";
        DialogResult[DialogResult["Yes"] = 3] = "Yes";
        DialogResult[DialogResult["No"] = 4] = "No";
    })(exports.DialogResult || (exports.DialogResult = {}));
    var DialogResult = exports.DialogResult;
    /**
     * [Replaceable] Creates and shows a native dialog (supports Bootstrap and jQuery UI dialogs).
     */
    function showNativeDialog(container, view, parameters, onShown, onClosed) {
        var dialog = container;
        if (dialog.modal !== undefined) {
            // Bootstrap dialog
            dialog.modal({});
            dialog.on("shown.bs.modal", function () { onShown(); });
            dialog.on("hidden.bs.modal", function () { onClosed(); });
        }
        else {
            // JQuery UI dialog: 
            dialog.bind('dialogclose', function () {
                dialog.dialog("destroy");
                onClosed();
            });
            onShown();
        }
    }
    exports.showNativeDialog = showNativeDialog;
    /**
     * [Replaceable] Closes the native dialog (supports Bootstrap and jQuery UI dialogs).
     */
    function closeNativeDialog(container) {
        var dialog = container;
        if (dialog.modal !== undefined) {
            // Bootstrap dialog
            dialog.modal("hide");
        }
        else {
            // JQuery UI dialog
            dialog.dialog("close");
        }
    }
    exports.closeNativeDialog = closeNativeDialog;
    // ----------------------------
    // KnockoutJS extensions
    // ----------------------------
    // Handler to define areas where a view model should not evaluate bindings
    ko.bindingHandlers["stopBinding"] = {
        init: function () {
            return { controlsDescendantBindings: true };
        }
    };
    ko.virtualElements.allowedBindings["stopBinding"] = true;
    // Handler to instantiate views directly in HTML (e.g. <span data-bind="view: { name: ... }" />)
    ko.bindingHandlers["view"] = {
        init: function (element, valueAccessor) {
            var rootView = null;
            if (currentContext !== null)
                rootView = currentContext.rootView;
            var value = ko.utils.unwrapObservable(valueAccessor());
            var factory = new ViewFactory();
            factory.create($(element), value.name, value, function (view) {
                ko.utils.domNodeDisposal.addDisposeCallback(element, function () { view.__destroyView(); });
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
    function getCurrentPage(frame) {
        var description = getCurrentPageDescription(frame);
        if (description !== null && description !== undefined)
            return description.view;
        return null;
    }
    exports.getCurrentPage = getCurrentPage;
    function getCurrentPageDescription(frame) {
        var pageStack = getPageStack(frame);
        if (pageStack.length > 0)
            return pageStack[pageStack.length - 1];
        return null;
    }
    function getPageStack(element) {
        var pageStack = element.data(pageStackAttribute);
        if (pageStack === null || pageStack === undefined) {
            pageStack = new Array();
            element.data(pageStackAttribute, pageStack);
        }
        return pageStack;
    }
    function tryNavigateForward(fullViewName, parameters, frame, pageContainer, navigate) {
        if (navigate) {
            if (parameters === undefined || parameters == null)
                parameters = {};
            parameters[isPageParameter] = true;
            return createView(pageContainer, fullViewName, parameters).then(function (view) {
                var restoreQuery = view.parameters.getRestoreQuery();
                currentNavigationPath = currentNavigationPath + "/" + encodeURIComponent(view.viewName + (restoreQuery !== undefined && restoreQuery !== null ? (":" + restoreQuery) : ""));
                window.location = "#" + currentNavigationPath;
                navigationHistory.push(frame);
                // current page
                var currentPage = getCurrentPageDescription(frame);
                if (currentPage !== null && currentPage !== undefined) {
                    currentPage.element.css("visibility", "hidden");
                    currentPage.element.css("position", "absolute");
                }
                // show next page by removing hiding css styles
                if (!exports.isPageRestore)
                    pageContainer.removeAttr("style");
                var pageStack = getPageStack(frame);
                pageStack.push({
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
        }
        else
            return Q(null);
    }
    ;
    // ----------------------------
    // Loading screen
    // ----------------------------
    var loadingCount = 0;
    var currentLoadingScreenElement = null;
    var loadingScreenElement = "<div class=\"loading-screen\"><img src=\"Content/Images/loading.gif\" class=\"loading-screen-image\" alt=\"Loading...\" /></div>";
    /**
     * Shows the loading screen. Always call hideLoadingScreen() for each showLoadingScreen() call.
     */
    function showLoadingScreen(delayed) {
        if (initialLoadingScreenElement !== null) {
            initialLoadingScreenElement.remove();
            initialLoadingScreenElement = null;
        }
        if (loadingCount === 0) {
            if (delayed == undefined || delayed) {
                setTimeout(function () {
                    if (loadingCount > 0)
                        appendLoadingElement();
                }, exports.loadingScreenDelay);
            }
            else
                appendLoadingElement();
        }
        loadingCount++;
    }
    exports.showLoadingScreen = showLoadingScreen;
    ;
    function appendLoadingElement() {
        if (currentLoadingScreenElement === null) {
            currentLoadingScreenElement = $(loadingScreenElement);
            $("body").append(currentLoadingScreenElement);
        }
    }
    /**
     * Hides the loading screen.
     */
    function hideLoadingScreen() {
        loadingCount--;
        if (loadingCount === 0) {
            if (currentLoadingScreenElement !== null) {
                currentLoadingScreenElement.remove();
                currentLoadingScreenElement = null;
            }
        }
    }
    exports.hideLoadingScreen = hideLoadingScreen;
    ;
    // ----------------------------
    // View model
    // ----------------------------
    var ViewModel = (function () {
        function ViewModel(view, parameters) {
            /**
             * Gets some global objects to use in bindings.
             */
            this.globals = globals;
            this.view = view;
            this.parameters = parameters;
        }
        /**
         * Enables page restoring for the current page.
         * This method must be called in the initialize() method.
         * Page restore only works for a page if all previous pages in the page stack support page restore.
         */
        ViewModel.prototype.enablePageRestore = function (restoreQuery) {
            this.parameters.setRestoreQuery(restoreQuery === undefined ? "" : restoreQuery);
        };
        /**
         * Subscribes to the given subscribable and stores the subscription automatic clean up.
         */
        ViewModel.prototype.subscribe = function (subscribable, callback) {
            this.view.subscribe(subscribable, callback);
        };
        /**
         * Loads a translated string.
         */
        ViewModel.prototype.getString = function (key) {
            return this.view.getString(key);
        };
        /**
         * [Virtual] Initializes the view before it is added to the DOM.
         */
        ViewModel.prototype.initialize = function (parameters) {
            // must be empty
        };
        /**
         * [Virtual] Called when the view has been added to the DOM.
         */
        ViewModel.prototype.onLoaded = function () {
            // must be empty
        };
        /**
         * [Virtual] Called before the view is added to the DOM with the ability to perform async work.
         * The callback() must be called when the work has been performed.
         */
        ViewModel.prototype.onLoading = function () {
            return Q(null);
        };
        /**
         * [Virtual] Called to clean up resources when the view has been removed from the DOM.
         */
        ViewModel.prototype.destroy = function () {
            // must be empty
        };
        return ViewModel;
    })();
    exports.ViewModel = ViewModel;
    // ----------------------------
    // View
    // ----------------------------
    var ViewBase = (function () {
        function ViewBase() {
            /**
             * Gets the view's parent view.
             */
            this.viewParent = null;
            /**
             * Gets the view's direct child views.
             */
            this.viewChildren = ko.observableArray();
            this.isDestroyed = false;
            this.subViews = [];
            this.disposables = [];
            this.isViewLoaded = ko.observable(false);
        }
        /**
         * Enables page restoring for the current page.
         * This method must be called in the initialize() method.
         * Page restore only works for a page if all previous pages in the page stack support page restore.
         */
        ViewBase.prototype.enablePageRestore = function (restoreQuery) {
            this.viewModel.enablePageRestore(restoreQuery);
        };
        /**
         * Subscribes to the given subscribable and stores the subscription automatic clean up.
         */
        ViewBase.prototype.subscribe = function (subscribable, callback) {
            var subscription = subscribable.subscribe(callback);
            this.disposables.push(subscription);
            return subscription;
        };
        /**
         * Loads a translated string.
         */
        ViewBase.prototype.getString = function (key) {
            return getString(key, this.viewPackage);
        };
        /**
         * Finds elements inside this view with a selector.
         */
        ViewBase.prototype.findElements = function (selector) {
            return this.element.find(selector);
        };
        /**
         * Gets an element by ID (defined using the "vs-id" attribute) inside this view.
         */
        ViewBase.prototype.getViewElement = function (id) {
            return this.findElements("#" + this.viewId + "_" + id);
        };
        // event methods
        /**
         * [Virtual] Initializes the view before it is added to the DOM.
         */
        ViewBase.prototype.initialize = function (parameters) {
            // must be empty
        };
        /**
         * [Virtual] Called before the view is added to the DOM with the ability to perform async work.
         * The callback() must be called when the work has been performed.
         */
        ViewBase.prototype.onLoading = function () {
            return Q(null);
        };
        /**
         * [Virtual] Called when the view has been added to the DOM.
         */
        ViewBase.prototype.onLoaded = function () {
            // must be empty
        };
        /**
         * [Virtual] Called to clean up resources when the view has been removed from the DOM.
         */
        ViewBase.prototype.destroy = function () {
            // must be empty
        };
        // ReSharper disable InconsistentNaming
        ViewBase.prototype.__destroyView = function () {
            $.each(this.subViews, function (index, view) {
                view.__destroyView();
            });
            if (!this.isDestroyed) {
                log("Destroying view '" + this.viewId + "' (" + this.viewClass + ") with " +
                    this.subViews.length + " subviews");
                delete views[this.viewId];
                this.viewModel.destroy();
                this.destroy();
                $.each(this.disposables, function (index, item) {
                    item.dispose();
                });
                if (this.viewParent != null)
                    this.viewParent.viewChildren.remove(this);
                this.isDestroyed = true;
            }
        };
        ViewBase.prototype.__setViewParent = function (viewParent) {
            if (this.viewParent !== null)
                throw "Parent view has already been set.";
            this.viewParent = viewParent;
            if (this.viewParent != null)
                this.viewParent.viewChildren.push(this);
        };
        ViewBase.prototype.__addSubView = function (view) {
            this.subViews.push(view);
        };
        return ViewBase;
    })();
    exports.ViewBase = ViewBase;
    var View = (function (_super) {
        __extends(View, _super);
        function View() {
            _super.apply(this, arguments);
        }
        return View;
    })(ViewBase);
    exports.View = View;
    // ----------------------------
    // Page
    // ----------------------------
    var Page = (function (_super) {
        __extends(Page, _super);
        function Page() {
            _super.apply(this, arguments);
        }
        /**
         * [Virtual] Called when navigated to this page.
         */
        Page.prototype.onNavigatedTo = function (type) {
            // must be empty
        };
        /**
         * [Virtual] Called after navigated from this page.
         */
        Page.prototype.onNavigatedFrom = function (type) {
            // must be empty
        };
        /**
         * [Virtual] Called when navigating to this page.
         * The callback() must be called with a boolean stating whether to navigate or cancel the navigation operation.
         */
        Page.prototype.onNavigatingFrom = function (type) {
            return Q(true);
        };
        return Page;
    })(View);
    exports.Page = Page;
    var PageBase = (function (_super) {
        __extends(PageBase, _super);
        function PageBase() {
            _super.apply(this, arguments);
        }
        return PageBase;
    })(Page);
    exports.PageBase = PageBase;
    // ----------------------------
    // Dialog
    // ----------------------------
    var Dialog = (function (_super) {
        __extends(Dialog, _super);
        function Dialog() {
            _super.apply(this, arguments);
            /**
             * Gets the dialog result.
             */
            this.result = DialogResult.Undefined;
        }
        /**
         * Closes the dialog.
         */
        Dialog.prototype.close = function (result) {
            this.result = result;
            closeNativeDialog(this.element);
        };
        /**
         * [Virtual] Called when the dialog is shown and all animations have finished.
         */
        Dialog.prototype.onShown = function () {
        };
        /**
         * [Virtual] Called after the dialog has been closed.
         */
        Dialog.prototype.onClosed = function () {
        };
        return Dialog;
    })(View);
    exports.Dialog = Dialog;
    var DialogBase = (function (_super) {
        __extends(DialogBase, _super);
        function DialogBase() {
            _super.apply(this, arguments);
        }
        return DialogBase;
    })(Dialog);
    exports.DialogBase = DialogBase;
    // ----------------------------
    // Parameters
    // ----------------------------
    var Parameters = (function () {
        function Parameters(parameters, element) {
            this.parameters = {};
            this.originalParameters = {};
            if (parameters !== undefined && parameters !== null)
                this.originalParameters = (parameters);
            this.parseElementChildren(element);
        }
        Parameters.prototype.getObservableString = function (key, defaultValue) {
            return this.getObservableWithConversion(key, function (value) { return value.toString(); }, defaultValue);
        };
        Parameters.prototype.getObservableNumber = function (key, defaultValue) {
            return this.getObservableWithConversion(key, function (value) { return Number(value); }, defaultValue);
        };
        Parameters.prototype.getObservableBoolean = function (key, defaultValue) {
            return this.getObservableWithConversion(key, function (value) { return value.toString().toLowerCase() === "true"; }, defaultValue);
        };
        Parameters.prototype.getObservableObject = function (key, defaultValue) {
            return this.getObservableWithConversion(key, function (value) { return value; }, defaultValue);
        };
        Parameters.prototype.getString = function (key, defaultValue) {
            return this.getObservableString(key, defaultValue)();
        };
        Parameters.prototype.getNumber = function (key, defaultValue) {
            return this.getObservableNumber(key, defaultValue)();
        };
        Parameters.prototype.getBoolean = function (key, defaultValue) {
            return this.getObservableBoolean(key, defaultValue)();
        };
        Parameters.prototype.getObject = function (key, defaultValue) {
            return this.getObservableObject(key, defaultValue)();
        };
        Parameters.prototype.setValue = function (key, value) {
            var observable = this.getObservableObject(key, value);
            observable(value);
        };
        Parameters.prototype.getObservableArray = function (key, defaultValue) {
            if (this.parameters[key] === undefined) {
                if (this.originalParameters[key] !== undefined) {
                    if ($.isFunction(this.originalParameters[key]))
                        this.parameters[key] = this.originalParameters[key];
                    else
                        this.parameters[key] = ko.observable(this.originalParameters[key]);
                }
                else if (defaultValue !== undefined)
                    this.parameters[key] = ko.observableArray(defaultValue);
                else
                    throw new Error("The parameter '" + key + "' is not defined and no default value is provided.");
            }
            return this.parameters[key];
        };
        Parameters.prototype.getRestoreQuery = function () {
            return this.originalParameters["restoreQuery"];
        };
        Parameters.prototype.setRestoreQuery = function (restoreQuery) {
            this.originalParameters["restoreQuery"] = restoreQuery;
        };
        Parameters.prototype.getObservableWithConversion = function (key, valueConverter, defaultValue) {
            if (this.parameters[key] === undefined) {
                if (this.originalParameters[key] !== undefined) {
                    if ($.isFunction(this.originalParameters[key]))
                        this.parameters[key] = this.originalParameters[key];
                    else
                        this.parameters[key] = ko.observable(valueConverter(this.originalParameters[key]));
                }
                else if (defaultValue !== undefined)
                    this.parameters[key] = ko.observable(defaultValue);
                else
                    throw new Error("The parameter '" + key + "' is not defined and no default value is provided.");
            }
            return this.parameters[key];
        };
        Parameters.prototype.parseElementChildren = function (element) {
            var _this = this;
            element.children().each(function (index, child) {
                var value = _this.createObjectFromElement($(child));
                _this.originalParameters[convertDashedToCamelCase(child.tagName.toLowerCase())] = value;
            });
        };
        Parameters.prototype.createObjectFromElement = function (element) {
            var _this = this;
            var children = element.children();
            if (children.length > 0) {
                var array = [];
                children.each(function (index, child) {
                    array.push(_this.createObjectFromElement($(child)));
                });
                return array;
            }
            else {
                var object = {};
                $.each(element.get(0).attributes, function (index, attr) {
                    object[attr.name] = attr.value; // TODO: Also evaluate bindings 
                });
                return object;
            }
        };
        return Parameters;
    })();
    exports.Parameters = Parameters;
    // ----------------------------
    // View factory
    // ----------------------------
    function createView(element, fullViewName, parameters) {
        return Q.Promise(function (resolve) {
            var factory = new ViewFactory();
            factory.create(element, fullViewName, parameters, function (view) {
                resolve(view);
            });
        });
    }
    exports.createView = createView;
    ;
    var ViewFactory = (function () {
        function ViewFactory() {
        }
        ViewFactory.prototype.create = function (element, fullViewName, parameters, completed) {
            this.element = element;
            if (currentContext === undefined || currentContext === null) {
                // from foreach, other late-bindings or root view
                this.context = new ViewContext(completed);
                this.parentView = getViewFromElement(element);
                this.completed = null;
                this.isRootView = true;
            }
            else {
                this.context = currentContext;
                this.parentView = currentContext.parentView;
                this.completed = completed;
                this.isRootView = false;
            }
            this.viewLocator = new ViewLocator(fullViewName, this.context, this.parentView);
            this.parameters = new Parameters(parameters, element);
            var lazySubviewLoading = this.parameters.getBoolean(lazyViewLoadingOption, false);
            if (!lazySubviewLoading)
                this.context.viewCount++;
            this.loadScriptsAndLanguageFile();
        };
        ViewFactory.prototype.loadScriptsAndLanguageFile = function () {
            var _this = this;
            var count = 3;
            tryRequire([this.viewLocator.package + "/views/" + this.viewLocator.view], function (m) {
                _this.viewModule = m;
                if ((--count) === 0)
                    _this.loadHtml();
            });
            tryRequire([this.viewLocator.package + "/viewModels/" + this.viewLocator.view + "Model"], function (m) {
                _this.viewModelModule = m;
                if ((--count) === 0)
                    _this.loadHtml();
            });
            loadLanguageFile(this.viewLocator.package, function () {
                if ((--count) === 0)
                    _this.loadHtml();
            });
        };
        ViewFactory.prototype.loadHtml = function () {
            var _this = this;
            var isLoadingOrLoaded = loadedViews[this.viewLocator.name] !== undefined;
            if (isLoadingOrLoaded) {
                var isLoading = loadedViews[this.viewLocator.name].running;
                if (isLoading) {
                    log("Loading view from server [redundant call]: " + this.viewLocator.name);
                    loadedViews[this.viewLocator.name].callbacks.push(function (data) { return _this.htmlLoaded(data); });
                }
                else {
                    log("Loading view from cache: " + this.viewLocator.name);
                    this.htmlLoaded(loadedViews[this.viewLocator.name].data);
                }
            }
            else {
                loadedViews[this.viewLocator.name] = {
                    data: null,
                    running: true,
                    callbacks: [function (data) { return _this.htmlLoaded(data); }]
                };
                log("Loading view from server: " + this.viewLocator.name);
                $.ajax({
                    url: "Scripts/" + this.viewLocator.package + "/views/" + this.viewLocator.view + ".html",
                    dataType: "html"
                }).done(function (data) {
                    data = _this.processCustomTags(data);
                    data = _this.processKnockoutAttributes(data);
                    loadedViews[_this.viewLocator.name].data = data;
                    loadedViews[_this.viewLocator.name].running = false;
                    $.each(loadedViews[_this.viewLocator.name].callbacks, function (index, item) {
                        item(data);
                    });
                }).fail(function () {
                    var data = "<div>[View '" + _this.viewLocator.name + "' not found]</div>";
                    loadedViews[_this.viewLocator.name].data = data;
                    loadedViews[_this.viewLocator.name].running = false;
                    $.each(loadedViews[_this.viewLocator.name].callbacks, function (index, item) {
                        item(data);
                    });
                });
            }
        };
        ViewFactory.prototype.htmlLoaded = function (htmlData) {
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
            if (exports.language() !== null)
                replaceLanguageStrings(this.rootElement, this.viewLocator.package);
            this.view = this.instantiateView();
            this.viewModel = this.instantiateViewModel(this.view);
            // initialize and retrieve restore query
            this.view.initialize(this.parameters);
            this.viewModel.initialize(this.parameters);
            if (this.isRootView)
                this.context.restoreQuery = this.parameters.getRestoreQuery();
            var lazySubviewLoading = this.parameters.getBoolean(lazyViewLoadingOption, false);
            if (lazySubviewLoading) {
                this.__setHtml();
                ko.applyBindings(this.viewModel, this.rootElement.get(0));
                this.__raiseLoadedEvents();
            }
            else {
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
        };
        ViewFactory.prototype.instantiateView = function () {
            var view;
            var hasView = this.viewModule !== undefined && this.viewModule !== null;
            if (hasView)
                view = (new this.viewModule[this.viewLocator.className]());
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
        };
        ViewFactory.prototype.instantiateViewModel = function (view) {
            var viewModel;
            var hasViewModel = this.viewModelModule !== undefined && this.viewModelModule !== null;
            if (hasViewModel)
                viewModel = (new this.viewModelModule[this.viewLocator.className + "Model"](view, this.parameters));
            else
                viewModel = new ViewModel(view, this.parameters);
            view.viewModel = viewModel;
            return viewModel;
        };
        /**
         * Process custom tags in the given HTML data string.
         */
        ViewFactory.prototype.processCustomTags = function (data) {
            data = data
                .replace(/vs-translate="/g, "data-translate=\"")
                .replace(/vs-bind="/g, "data-bind=\"")
                .replace(/<vs-([a-zA-Z0-9-]+?) ([^]*?)(\/>|>)/g, function (match, tagName, attributes, tagClosing) {
                var path = "";
                var pkg = "";
                var bindings = "";
                var htmlAttributes = "";
                attributes.replace(/([a-zA-Z0-9-]*?)="([^]*?)"/g, function (match, attributeName, attributeValue) {
                    if (attributeName.indexOf("vs-") === 0 || attributeName === "class" || attributeName === "style") {
                        htmlAttributes += " " + match;
                        return match;
                    }
                    else {
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
                return '<div data-bind="view: { ' + bindings + ' }" ' + htmlAttributes + tagClosing;
            });
            return data;
        };
        /**
         * Process Knockout attributes (vs-) in the given HTML data string (must be called after processCustomTags).
         */
        ViewFactory.prototype.processKnockoutAttributes = function (data) {
            data = data.replace(/<([a-zA-Z0-9-]+?) ([^]*?)(\/>|>)/g, function (match, tagName, attributes, tagClosing) {
                var existingDataBindValue = "";
                var additionalDataBindValue = "";
                attributes = attributes.replace(/([a-zA-Z0-9-]+?)="([^]*?)"/g, function (match, key, value) {
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
            return data.replace(/{{(.*?)}}/g, function (g) { return "<span data-bind=\"text: " + g.substr(2, g.length - 4) + "\"></span>"; });
        };
        // ReSharper disable InconsistentNaming
        ViewFactory.prototype.__raiseLoadedEvents = function () {
            this.view.onLoaded();
            this.viewModel.onLoaded();
            this.view.isViewLoaded(true);
        };
        ViewFactory.prototype.__setHtml = function () {
            this.element.html(this.rootElement);
        };
        return ViewFactory;
    })();
    var ViewContext = (function () {
        function ViewContext(completed) {
            this.factories = [];
            this.initializers = [];
            this.rootPackage = defaultPackage;
            this.rootView = null;
            this.parentPackage = defaultPackage;
            this.parentView = null;
            this.viewCount = 0;
            this.restoreQuery = undefined;
            this.loadedViewCount = 0;
            this.completed = completed;
        }
        ViewContext.prototype.loaded = function () {
            var _this = this;
            this.loadedViewCount++;
            if (this.loadedViewCount === this.viewCount) {
                this.loadedViewCount = 0;
                $.each(this.factories, function (index, context) {
                    context.view.onLoading().then(function () {
                        _this.loadedViewCount++;
                        if (_this.loadedViewCount === _this.viewCount) {
                            _this.loadedViewCount = 0;
                            $.each(_this.factories, function (index, context) {
                                context.viewModel.onLoading().then(function () {
                                    _this.loadedViewCount++;
                                    if (_this.loadedViewCount === _this.viewCount) {
                                        $.each(_this.factories.reverse(), function (index, factory) {
                                            factory.__setHtml();
                                        });
                                        if ($.isFunction(_this.completed))
                                            _this.completed(_this.rootView, _this.rootView.viewModel, _this.restoreQuery);
                                        $.each(_this.factories, function (index, factory) {
                                            factory.__raiseLoadedEvents();
                                        });
                                        $.each(_this.initializers, function (index, initializer) {
                                            initializer();
                                        });
                                    }
                                }).done();
                            });
                        }
                    }).done();
                });
            }
        };
        return ViewContext;
    })();
    var ViewLocator = (function () {
        function ViewLocator(fullViewName, context, parentView) {
            if (fullViewName.indexOf(":") !== -1) {
                var arr = fullViewName.split(":");
                this.package = getPackageName(arr[0]);
                this.view = arr[1];
            }
            else {
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
        return ViewLocator;
    })();
});
//# sourceMappingURL=visto.js.map
// Visto JavaScript Framework (VistoJS) v2.0.0
// (c) Rico Suter - http://visto.codeplex.com/
// License: Microsoft Public License (Ms-PL) (https://visto.codeplex.com/license)
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "libs/hashchange"], function (require, exports, __hashchange) {
    /// <reference path="knockout.d.ts" />
    /// <reference path="jquery.d.ts" />
    /// <reference path="jqueryui.d.ts" />
    /// <reference path="visto.extensions.d.ts" />
    /// <reference path="visto.modules.d.ts" />
    exports.__hashchange = __hashchange;
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
    exports.loadingScreenDelay = 300;
    exports.isLogging = true;
    // variables
    var views = {};
    var viewCount = 0;
    var navigationCount = 0;
    var navigationHistory = new Array();
    var loadedViews = ([]);
    var isNavigating = false;
    var openedDialogs = 0;
    var defaultCommands = {
        navigateBack: function () {
            navigateBack();
        }
    };
    // internationalization variables
    exports.language = ko.observable(null);
    exports.supportedLanguages = [];
    var previousLanguage = null;
    var languageStrings = ([]);
    // local variables
    var currentNavigationPath = "";
    var currentContext = null;
    var initialBody = $("body").find("div");
    // ----------------------------
    // Initializer
    // ----------------------------
    /**
     * Initializes the framework and navigates to the first page or restores the pages.
     */
    function initialize(options) {
        defaultPackage = options.defaultPackage === undefined ? defaultPackage : options.defaultPackage;
        setUserLanguage(options.supportedLanguages);
        if (options.registerEnterKeyFix === undefined || options.registerEnterKeyFix) {
            $(document).bind("keypress", function (ev) {
                if (ev.keyCode === 13 && ev.target.localName === "input")
                    ev.preventDefault();
            });
        }
        restorePages(options.defaultView);
    }
    exports.initialize = initialize;
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
        require(moduleNames, function (result) {
            completed(result);
        }, function () {
            completed(null);
        });
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
    function getPackageNameForModule(packageModule) {
        var modulePath = "/" + packageModule.id;
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
    function getViewName(packageModule, viewPath) {
        return getPackageNameForModule(packageModule) + ":" + viewPath;
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
            var url = "Scripts/" + packageName + "/languages/" + lang + ".json";
            if (languageLoadings[url] === undefined) {
                languageLoadings[url] = [completed];
                $.ajax({
                    url: url,
                    type: "get",
                    dataType: "json"
                }).done(function (result) {
                    languageStrings[lang][packageName] = result;
                    $.each(languageLoadings[url], function (index, item) {
                        item();
                    });
                    delete languageLoadings[url];
                }).fail(function (xhr, ajaxOptions) {
                    languageStrings[lang][packageName] = ([]);
                    $.each(languageLoadings[url], function (index, item) {
                        item();
                    });
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
    function getString(key, path, completed) {
        path = getPackageName(path);
        var lang = exports.language();
        if (languageStrings[lang] === undefined)
            languageStrings[lang] = ([]);
        if (languageStrings[lang][path] === undefined) {
            loadLanguageFile(path, function () {
                getStringForLanguage(lang, path, key, completed);
            });
            if (previousLanguage !== null)
                return getStringForLanguage(previousLanguage, path, key);
            return "";
        }
        else
            return getStringForLanguage(lang, path, key, completed);
    }
    exports.getString = getString;
    ;
    /**
     * Loads a translated string as observable object which updates when the language changes.
     */
    function getStringAsObservable(key, path) {
        var observable = ko.observable();
        observable(getString(key, path, function (value) {
            observable(value);
        }));
        return observable;
    }
    exports.getStringAsObservable = getStringAsObservable;
    ;
    /**
     * Loads a translated string for a given language.
     */
    function getStringForLanguage(lang, path, key, completed) {
        var value = languageStrings[lang][path][key];
        if (value === undefined)
            value = path + ":" + key;
        if (completed !== undefined)
            completed(value);
        return value;
    }
    exports.getStringForLanguage = getStringForLanguage;
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
            if (parent.length === 0)
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
    // ----------------------------
    // Page stack handling
    // ----------------------------
    /**
     * Restores the page stack on the body element as frame.
     */
    function restorePages(fullViewName, params, completed) {
        $("body").restorePages(fullViewName, params, completed);
    }
    exports.restorePages = restorePages;
    ;
    function navigateTo(a, b, c, d) {
        if (typeof a === "string")
            $("body").navigateTo(a, b, c);
        else
            $("body").navigateTo(getViewName(a, b), c, d);
    }
    exports.navigateTo = navigateTo;
    /**
     * Gets the current page.
     */
    function currentPage() {
        return $("body").currentPage();
    }
    exports.currentPage = currentPage;
    ;
    var backNavigationCompleted = null;
    /**
     * Navigates to the previous page.
     */
    function navigateBack(completed) {
        if (isNavigating) {
            if ($.isFunction(completed))
                completed(false);
        }
        else {
            backNavigationCompleted = $.isFunction(completed) ? completed : null;
            history.go(-1);
        }
    }
    exports.navigateBack = navigateBack;
    ;
    function tryNavigateBack(navigate, currentPage, pageStack) {
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
            window.location = "#" + currentPage.hash;
        isNavigating = false;
        if ($.isFunction(backNavigationCompleted))
            backNavigationCompleted(navigate);
        backNavigationCompleted = null;
    }
    ;
    /**
     * Navigates back to the home page (first page in stack).
     */
    function navigateHome(completed) {
        if (navigationCount <= 1) {
            if ($.isFunction(completed))
                completed(true);
        }
        else {
            navigateBack(function (successful) {
                if (successful)
                    navigateHome(completed);
                else if ($.isFunction(completed))
                    completed(false);
            });
        }
    }
    exports.navigateHome = navigateHome;
    ;
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
                            currentPage.view.onNavigatingFrom("back", function (navigate) {
                                tryNavigateBack(navigate, currentPage, pageStack);
                            });
                        }
                    }
                }
            }
        }
    });
    function dialog(a, b, c, d, e, f) {
        if (typeof a === "string")
            showDialog(a, b, c, d, e);
        else
            showDialog(getViewName(a, b), c, d, e, f);
    }
    exports.dialog = dialog;
    function showDialog(fullViewName, parameters, dialogOptions, closed, completed) {
        var dialog = $("<div />");
        $('body').append(dialog);
        dialog.view(fullViewName, parameters, function (view, viewModel) {
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
            dialog.bind('dialogclose', function () {
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
    }
    ;
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
            var loader = new ViewFactory();
            loader.create($(element), value.name, value, function (view) {
                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    view.__destroyView();
                });
                if (rootView !== null)
                    rootView.__addSubView(view);
            });
        }
    };
    // ----------------------------
    // JQuery extensions
    // ----------------------------
    // Inserts a view inside an element (JQuery)
    $.fn.view = function (fullViewName, parameters, completed) {
        var loader = new ViewFactory();
        loader.create(this, fullViewName, parameters, completed);
        return this;
    };
    var isRestoringPages = false;
    // Restores the page stack using the current query hash 
    $.fn.restorePages = function (fullViewName, parameters, completed) {
        var frame = $(this);
        var urlSegments = decodeURIComponent(window.location.hash).split("/");
        if (urlSegments.length > 1) {
            isRestoringPages = true;
            showLoading(false);
            var currentSegmentIndex = 1;
            var navigateTo = function (view) {
                var segment = urlSegments[currentSegmentIndex];
                if (segment != null) {
                    var segmentParts = segment.split(":");
                    var supportsPageRestore = segmentParts.length === 3;
                    if (supportsPageRestore) {
                        currentSegmentIndex++;
                        var fullViewName = segmentParts[0] + ":" + segmentParts[1];
                        var restoreQuery = segmentParts.length === 3 ? segmentParts[2] : undefined;
                        frame.navigateTo(fullViewName, { restoreQuery: restoreQuery }, function (view) {
                            navigateTo(view);
                        });
                    }
                    else
                        finishPageRestore(frame, view, completed);
                }
                else
                    finishPageRestore(frame, view, completed);
            };
            navigateTo(null);
        }
        else
            frame.navigateTo(fullViewName, parameters, completed);
    };
    function finishPageRestore(frame, view, completed) {
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
    $.fn.navigateTo = function (fullViewName, parameters, completed) {
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
            currentPage.view.onNavigatingFrom("forward", function (navigate) {
                tryNavigateForward(fullViewName, parameters, frame, pageContainer, navigate, function (view, restoreQuery) {
                    if (completed !== undefined)
                        completed(view, restoreQuery);
                    hideLoading();
                });
            });
        }
        else {
            tryNavigateForward(fullViewName, parameters, frame, pageContainer, true, function (view, restoreQuery) {
                if (completed !== undefined)
                    completed(view, restoreQuery);
                hideLoading();
            });
        }
        return frame;
    };
    function getPageStack(element) {
        var pageStack = element.data(pageStackAttribute);
        if (pageStack === null || pageStack === undefined) {
            pageStack = new Array();
            element.data(pageStackAttribute, pageStack);
        }
        return pageStack;
    }
    function getCurrentPage(element) {
        var pageStack = getPageStack(element);
        if (pageStack.length > 0)
            return pageStack[pageStack.length - 1];
        return null;
    }
    function tryNavigateForward(fullViewName, parameters, frame, pageContainer, navigate, completed) {
        if (navigate) {
            if (parameters === undefined || parameters == null)
                parameters = {};
            parameters[isPageParameter] = true;
            pageContainer.view(fullViewName, parameters, function (view, viewModel, restoreQuery) {
                currentNavigationPath = currentNavigationPath + "/" + encodeURIComponent(view.viewName + (restoreQuery !== undefined && restoreQuery !== null ? (":" + restoreQuery) : ""));
                window.location = "#" + currentNavigationPath;
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
                pageStack.push({
                    view: view,
                    hash: ++navigationCount,
                    element: pageContainer
                });
                log("Navigated to new page " + view.viewClass + ", page stack size: " + pageStack.length);
                view.onNavigatedTo("forward");
                if (currentPage !== null && currentPage !== undefined)
                    currentPage.view.onNavigatedFrom("forward");
                isNavigating = false;
                completed(view, restoreQuery);
            });
        }
        else
            completed(null, null);
    }
    ;
    // ----------------------------
    // Loading screen
    // ----------------------------
    var loadingCount = 0;
    var loadingElement = null;
    // Creates the loading screen element
    function createLoadingElement() {
        var element = $(document.createElement("div"));
        element.addClass("ui-widget-overlay ui-front");
        element.html("<div style='text-align: center; color: white'>" + "<img src='Content/Images/loading.gif' style='border: 0; margin-top: 150px' /></div>");
        return element;
    }
    exports.createLoadingElement = createLoadingElement;
    ;
    // Shows the loading screen
    function showLoading(delayed) {
        if (initialBody !== null) {
            initialBody.remove();
            initialBody = null;
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
        log("show: " + loadingCount);
    }
    exports.showLoading = showLoading;
    ;
    function appendLoadingElement() {
        if (loadingElement === null) {
            loadingElement = createLoadingElement();
            $("body").append(loadingElement);
            log("appended");
        }
    }
    // Hides the loading screen
    function hideLoading() {
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
    }
    exports.hideLoading = hideLoading;
    ;
    // ----------------------------
    // View model
    // ----------------------------
    var ViewModel = (function () {
        function ViewModel(view, parameters) {
            this.defaultCommands = defaultCommands;
            this.__restoreQuery = null;
            this.view = view;
            this.parameters = parameters;
        }
        /**
         * Enables page restoring for the current page.
         * This method must be called in the initialize() method.
         * Page restore only works for a page if all previous pages in the page stack support page restore.
         */
        ViewModel.prototype.enablePageRestore = function (restoreQuery) {
            this.__restoreQuery = restoreQuery === undefined ? "" : restoreQuery;
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
        ViewModel.prototype.onLoading = function (callback) {
            callback();
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
            this.parentView = null;
            this.isDestroyed = false;
            this.subViews = [];
            this.disposables = [];
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
         * Finds an element inside this view.
         */
        ViewBase.prototype.getElement = function (selector) {
            if (selector[0] === "#")
                return this.element.find(selector[0] + this.viewId + "_" + selector.substring(1)); // TODO: How to reference?
            return this.element.find(selector);
        };
        /**
         * Finds an element by ID inside this view.
         */
        ViewBase.prototype.getElementById = function (id) {
            return this.getElement("#" + id); // TODO: How to reference?
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
        ViewBase.prototype.onLoading = function (callback) {
            callback();
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
        /**
         * Destroys a view by removing it from the view list, calling the needed event handlers and disposing depending objects.
         */
        ViewBase.prototype.__destroyView = function () {
            $.each(this.subViews, function (index, view) {
                view.__destroyView();
            });
            if (!this.isDestroyed) {
                log("Destroying view '" + this.viewId + "' (" + this.viewClass + ") with " + this.subViews.length + " subviews");
                delete views[this.viewId];
                this.viewModel.destroy();
                this.destroy();
                $.each(this.disposables, function (index, item) {
                    item.dispose();
                });
                this.isDestroyed = true;
            }
        };
        // ReSharper disable InconsistentNaming
        ViewBase.prototype.__setParentView = function (parentView) {
            if (this.parentView !== null)
                throw "Parent view has already been set.";
            this.parentView = parentView;
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
        Page.prototype.onNavigatingFrom = function (type, callback) {
            callback(true);
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
        }
        Dialog.prototype.initializeDialog = function (options) {
            // must be empty
        };
        return Dialog;
    })(View);
    exports.Dialog = Dialog;
    // ----------------------------
    // Parameters
    // ----------------------------
    var Parameters = (function () {
        function Parameters(parameters) {
            if (parameters === undefined || parameters === null)
                this.parameters = ({});
            else
                this.parameters = (parameters);
        }
        Parameters.prototype.getObservable = function (key, defaultValue) {
            if (this.parameters[key] === undefined)
                this.parameters[key] = ko.observable(defaultValue);
            else if ($.isFunction(this.parameters[key]))
                return this.parameters[key];
            else
                this.parameters[key] = ko.observable(this.parameters[key]);
            return this.parameters[key];
        };
        Parameters.prototype.getObservableArray = function (key, defaultValue) {
            if (this.parameters[key] === undefined)
                this.parameters[key] = ko.observableArray(defaultValue);
            else if ($.isFunction(this.parameters[key]))
                return this.parameters[key];
            else
                this.parameters[key] = ko.observableArray(this.parameters[key]);
            return this.parameters[key];
        };
        Parameters.prototype.getValue = function (key, defaultValue) {
            if (this.parameters[key] === undefined) {
                this.parameters[key] = defaultValue;
                return defaultValue;
            }
            else if ($.isFunction(this.parameters[key]))
                return this.parameters[key]();
            return this.parameters[key];
        };
        /**
         * Sets a value either writing back through a binding or directly on the parameters object.
         */
        Parameters.prototype.setValue = function (key, value) {
            if ($.isFunction(this.parameters[key]))
                this.parameters[key](value);
            else
                this.parameters[key] = value;
        };
        Parameters.prototype.hasValue = function (key) {
            return this.parameters[key] !== undefined;
        };
        Parameters.prototype.isPageRestore = function () {
            return this.getRestoreQuery() !== undefined;
        };
        Parameters.prototype.getRestoreQuery = function () {
            return this.parameters["restoreQuery"];
        };
        return Parameters;
    })();
    exports.Parameters = Parameters;
    // ----------------------------
    // View factory
    // ----------------------------
    var ViewFactory = (function () {
        function ViewFactory() {
        }
        /**
         * Creates a view for the given element.
         */
        ViewFactory.prototype.create = function (element, fullViewName, params, completed) {
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
            this.parameters = new Parameters(params);
            var lazySubviewLoading = this.parameters.getValue(lazySubviewLoadingOption, false);
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
            htmlData = "<!-- ko stopBinding -->" + htmlData.replace(/vId/g, this.viewId) + "<!-- /ko -->";
            var container = $(document.createElement("div"));
            container.html(htmlData);
            this.rootElement = container.children()[0];
            this.element.attr(viewIdAttribute, this.viewId);
            if (exports.language() !== null)
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
                ko.applyBindings(this.viewModel, this.rootElement);
                currentContext = null;
                this.context.loaded();
            }
            if ($.isFunction(this.completed))
                this.completed(this.view, this.viewModel, restoreQuery);
        };
        ViewFactory.prototype.instantiateView = function () {
            var view;
            var hasView = this.viewModule !== undefined && this.viewModule !== null;
            if (hasView)
                view = (new this.viewModule[this.viewLocator.className]());
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
         * Processes the custom tags in the given HTML data string.
         */
        ViewFactory.prototype.processCustomTags = function (data) {
            return data.replace(/<vs-([\s\S]+?) ([\s\S]*?)(\/>|>)/g, function (match, tag, attributes, close) {
                var path = "";
                var pkg = "";
                var bindings = "";
                attributes.replace(/([\s\S]*?)="([\s\S]*?)"/g, function (match, name, value) {
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
        };
        // ReSharper disable InconsistentNaming
        ViewFactory.prototype.__raiseLoadedEvents = function () {
            this.view.onLoaded();
            this.viewModel.onLoaded();
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
                    context.view.onLoading(function () {
                        _this.loadedViewCount++;
                        if (_this.loadedViewCount === _this.viewCount) {
                            _this.loadedViewCount = 0;
                            $.each(_this.factories, function (index, context) {
                                context.viewModel.onLoading(function () {
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
                                });
                            });
                        }
                    });
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
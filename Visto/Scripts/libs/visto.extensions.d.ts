// Visto JavaScript Framework (VistoJS) v2.0.0
// (c) Rico Suter - http://visto.codeplex.com/
// License: Microsoft Public License (Ms-PL) (https://visto.codeplex.com/license)

/// <reference path="jquery.d.ts" />
/// <reference path="knockout.d.ts" />

import visto = require("visto");

interface JQuery {
    view(viewName: string, parameters?: Object, completed?: (view: visto.ViewBase, viewModel: visto.ViewModel) => void): JQuery;
    view(viewName: any[], parameters?: Object, completed?: (view: visto.ViewBase, viewModel: visto.ViewModel) => void): JQuery;

    navigateTo<TView extends visto.ViewBase>(viewName: string, parameters?: Object, completed?: (view: TView) => void): void;
    navigateTo<TView extends visto.ViewBase>(viewName: any[], parameters?: Object, completed?: (view: TView) => void): void;
    navigateTo(viewName: string, parameters?: Object, completed?: (view: visto.ViewBase) => void): JQuery;
    navigateTo(viewName: any[], parameters?: Object, completed?: (view: visto.ViewBase) => void): JQuery;

    restorePages<TView extends visto.ViewBase>(viewName: string, parameters?: Object, completed?: (view: TView) => void): void;
    restorePages<TView extends visto.ViewBase>(viewName: any[], parameters?: Object, completed?: (view: TView) => void): void;
    restorePages(viewName: string, parameters?: Object, completed?: (view: visto.ViewBase) => void): JQuery;
    restorePages(viewName: any[], parameters?: Object, completed?: (view: visto.ViewBase) => void): JQuery;

    currentPage<TView extends visto.ViewBase>(): TView;
}
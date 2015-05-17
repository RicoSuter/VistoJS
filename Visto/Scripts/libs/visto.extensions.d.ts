// Visto JavaScript Framework (VistoJS) v1.3.0
// (c) Rico Suter - http://visto.codeplex.com/
// License: Microsoft Public License (Ms-PL) (https://visto.codeplex.com/license)

/// <reference path="jquery.d.ts" />
/// <reference path="knockout.d.ts" />

import visto = require("visto");

interface JQuery {
    view(viewName: string, parameters?: Object, completed?: (view: visto.VistoViewBase, viewModel: visto.VistoViewModel) => void): JQuery;
    view(viewName: any[], parameters?: Object, completed?: (view: visto.VistoViewBase, viewModel: visto.VistoViewModel) => void): JQuery;

    navigateTo<TView extends visto.VistoViewBase>(viewName: string, parameters?: Object, completed?: (view: TView) => void): void;
    navigateTo<TView extends visto.VistoViewBase>(viewName: any[], parameters?: Object, completed?: (view: TView) => void): void;
    navigateTo(viewName: string, parameters?: Object, completed?: (view: visto.VistoViewBase) => void): JQuery;
    navigateTo(viewName: any[], parameters?: Object, completed?: (view: visto.VistoViewBase) => void): JQuery;

    restorePages<TView extends visto.VistoViewBase>(viewName: string, parameters?: Object, completed?: (view: TView) => void): void;
    restorePages<TView extends visto.VistoViewBase>(viewName: any[], parameters?: Object, completed?: (view: TView) => void): void;
    restorePages(viewName: string, parameters?: Object, completed?: (view: visto.VistoViewBase) => void): JQuery;
    restorePages(viewName: any[], parameters?: Object, completed?: (view: visto.VistoViewBase) => void): JQuery;

    currentPage<TView extends visto.VistoViewBase>(): TView;
}
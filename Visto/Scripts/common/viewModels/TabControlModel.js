var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    var TabControlModel = (function (_super) {
        __extends(TabControlModel, _super);
        function TabControlModel() {
            _super.apply(this, arguments);
            this.selectedTab = ko.observable(null);
        }
        TabControlModel.prototype.initialize = function () {
            this.tabs = this.parameters.getObservableArray("tabs");
            this.tabsChanged();
            this.subscribe(this.tabs, this.tabsChanged);
            this.selectedTab(this.tabs()[1].view.toString());
        };
        TabControlModel.prototype.tabsChanged = function () {
            var tabs = this.tabs();
            for (var i = 0, item; (item = tabs[i]) != undefined; i++) {
                if (item.view !== undefined && item.view.indexOf(":") === -1)
                    item.view = this.parentView.viewPackage + ":" + item.view;
            }
        };
        TabControlModel.prototype.setTab = function (tab) {
            this.selectedTab(tab.view.toString());
        };
        return TabControlModel;
    })(visto.VistoViewModel);
    exports.TabControlModel = TabControlModel;
});
//# sourceMappingURL=TabControlModel.js.map
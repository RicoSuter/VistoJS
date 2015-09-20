var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
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
            this.showBackButton = this.parameters.getBoolean("showBackButton", true);
            this.tabsChanged();
            this.subscribe(this.tabs, this.tabsChanged);
            this.selectedTab(this.tabs()[0].view);
        };
        TabControlModel.prototype.changeTab = function (tab) {
            this.selectedTab(tab.view.toString());
        };
        return TabControlModel;
    })(visto.ViewModel);
    exports.TabControlModel = TabControlModel;
});
//# sourceMappingURL=TabControlModel.js.map
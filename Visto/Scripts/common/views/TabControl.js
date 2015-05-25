var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    var TabControl = (function (_super) {
        __extends(TabControl, _super);
        function TabControl() {
            _super.apply(this, arguments);
        }
        TabControl.prototype.initialize = function () {
            var _this = this;
            this.viewModel.tabsChanged = function () {
                _this.onTabsChanged();
            };
        };
        TabControl.prototype.onTabsChanged = function () {
            var tabs = this.viewModel.tabs();
            for (var i = 0, item; (item = tabs[i]) != undefined; i++) {
                if (item.view !== undefined && item.view.indexOf(":") === -1)
                    item.view = this.parentView.viewPackage + ":" + item.view;
            }
        };
        return TabControl;
    })(visto.View);
    exports.TabControl = TabControl;
});
//# sourceMappingURL=TabControl.js.map
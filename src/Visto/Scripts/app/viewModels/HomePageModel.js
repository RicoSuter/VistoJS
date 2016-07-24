var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "libs/visto", "common/main", "module"], function (require, exports, visto, common, pkg) {
    "use strict";
    var HomePageModel = (function (_super) {
        __extends(HomePageModel, _super);
        function HomePageModel() {
            _super.apply(this, arguments);
        }
        HomePageModel.prototype.initialize = function () {
            this.enablePageRestore();
        };
        HomePageModel.prototype.navigateToBindings = function () {
            this.context.navigateTo(pkg, "BindingsPage").done();
        };
        HomePageModel.prototype.navigateToForm = function () {
            this.context.navigateTo(pkg, "FormPage").done();
        };
        HomePageModel.prototype.navigateToRecursivePage = function () {
            this.context.navigateTo(pkg, "RecursivePage").done();
        };
        HomePageModel.prototype.navigateToInternationalization = function () {
            this.context.navigateTo(pkg, "InternationalizationPage").done();
        };
        HomePageModel.prototype.navigateToTabPage = function () {
            this.context.navigateTo(pkg, "TabPage").done();
        };
        HomePageModel.prototype.navigateToListPage = function () {
            this.context.navigateTo(pkg, "ListPage").done();
        };
        HomePageModel.prototype.navigateToWebViewPage = function () {
            this.context.navigateTo(pkg, "WebViewPage").done();
        };
        HomePageModel.prototype.showAlert = function () {
            common.alert(this.context, this.getString("notImplementedTitle"), this.getString("notImplementedMessage"));
        };
        HomePageModel.prototype.showCustomDialog = function () {
            this.context.showDialog(pkg, "SampleDialog").done();
        };
        return HomePageModel;
    }(visto.ViewModel));
    exports.HomePageModel = HomePageModel;
    ;
});
//# sourceMappingURL=HomePageModel.js.map
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "libs/visto", "common/main", "module"], function (require, exports, visto, common, pkg) {
    var HomePageModel = (function (_super) {
        __extends(HomePageModel, _super);
        function HomePageModel() {
            _super.apply(this, arguments);
        }
        HomePageModel.prototype.initialize = function () {
            this.enablePageRestore();
        };
        HomePageModel.prototype.navigateToBindings = function () {
            visto.navigateTo(pkg, "BindingsPage");
        };
        HomePageModel.prototype.navigateToForm = function () {
            visto.navigateTo(pkg, "FormPage");
        };
        HomePageModel.prototype.navigateToRecursivePage = function () {
            visto.navigateTo(pkg, "RecursivePage");
        };
        HomePageModel.prototype.navigateToInternationalization = function () {
            visto.navigateTo(pkg, "InternationalizationPage");
        };
        HomePageModel.prototype.navigateToTabPage = function () {
            visto.navigateTo(pkg, "TabPage");
        };
        HomePageModel.prototype.navigateToListPage = function () {
            visto.navigateTo(pkg, "ListPage");
        };
        HomePageModel.prototype.navigateToWebViewPage = function () {
            visto.navigateTo(pkg, "WebViewPage");
        };
        HomePageModel.prototype.showAlert = function () {
            common.alert(this.getString("notImplementedTitle"), this.getString("notImplementedMessage"));
        };
        HomePageModel.prototype.showCustomDialog = function () {
            visto.showDialog(pkg, "SampleDialog");
        };
        return HomePageModel;
    })(visto.ViewModel);
    exports.HomePageModel = HomePageModel;
    ;
});
//# sourceMappingURL=HomePageModel.js.map
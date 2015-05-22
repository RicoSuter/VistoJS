var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "libs/visto", "common/main", "module"], function (require, exports, visto, common, package) {
    var MainPageModel = (function (_super) {
        __extends(MainPageModel, _super);
        function MainPageModel() {
            _super.apply(this, arguments);
        }
        MainPageModel.prototype.initialize = function () {
            this.enablePageRestore();
            this.selectedText = ko.observable("sample");
        };
        MainPageModel.prototype.navigateToTabPage = function () {
            visto.navigateTo(package, "TabPage");
        };
        MainPageModel.prototype.navigateToListPage = function () {
            visto.navigateTo(package, "ListPage");
        };
        MainPageModel.prototype.navigateToWebViewPage = function () {
            visto.navigateTo(package, "WebViewPage");
        };
        MainPageModel.prototype.showNotImplemented = function () {
            // sample of translation in code: 
            common.alert("Not implemented", this.getString("notImplementedMessage"));
        };
        MainPageModel.prototype.showDialog = function () {
            visto.showDialog(package, "SampleDialog", {
                title: "Sample dialog",
                buttons: [
                    { label: "OK", click: function (dialog) {
                        dialog.close();
                    } }
                ]
            });
        };
        return MainPageModel;
    })(visto.ViewModel);
    exports.MainPageModel = MainPageModel;
    ;
});
//# sourceMappingURL=MainPageModel.js.map
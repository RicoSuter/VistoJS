var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "libs/visto", "common/main", "SampleService", "module"], function (require, exports, visto, common, svc, package) {
    var ListPageModel = (function (_super) {
        __extends(ListPageModel, _super);
        function ListPageModel() {
            _super.apply(this, arguments);
            this.items = ko.observableArray();
            this.isLoading = ko.observable(false);
        }
        ListPageModel.prototype.initialize = function () {
            this.enablePageRestore();
        };
        ListPageModel.prototype.onLoaded = function () {
            var _this = this;
            this.isLoading(true);
            svc.getItems(function (items) {
                _this.items(items);
                _this.isLoading(false);
            });
        };
        ListPageModel.prototype.showItem = function (item) {
            visto.navigateTo(package, "DetailsPage", { item: item });
        };
        ListPageModel.prototype.addItem = function () {
            var _this = this;
            common.prompt("Add Item", "Please enter the item name: ", "").then(function (title) {
                _this.items.push({ id: 1, title: title });
            });
        };
        ListPageModel.prototype.deleteItem = function (item) {
            this.items.remove(item);
        };
        return ListPageModel;
    })(visto.ViewModel);
    exports.ListPageModel = ListPageModel;
    ;
});
//# sourceMappingURL=ListPageModel.js.map
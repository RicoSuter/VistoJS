var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    var ListPickerModel = (function (_super) {
        __extends(ListPickerModel, _super);
        function ListPickerModel() {
            _super.apply(this, arguments);
        }
        ListPickerModel.prototype.initialize = function (parameters) {
            this.items = parameters.getObservableArray("items");
            this.selectedItem = parameters.getObservable("selectedItem");
            this.enable = parameters.getObservable("enable", true);
            this.label = parameters.getObservable("label");
            this.optionsText = parameters.getValue("optionsText", "title");
        };
        return ListPickerModel;
    })(visto.VistoViewModel);
    exports.ListPickerModel = ListPickerModel;
});
//# sourceMappingURL=ListPickerModel.js.map
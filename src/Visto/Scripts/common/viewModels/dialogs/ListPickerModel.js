var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    var ListPickerModel = (function (_super) {
        __extends(ListPickerModel, _super);
        function ListPickerModel() {
            _super.apply(this, arguments);
        }
        ListPickerModel.prototype.initialize = function (parameters) {
            // TODO: Reimplement whole control
            this.items = parameters.getObservableArray("items");
            this.selectedItem = parameters.getObservableObject("selectedItem");
            this.enable = parameters.getObservableBoolean("enable", true);
            this.label = parameters.getObservableString("label");
            this.optionsText = parameters.getString("optionsText", "title");
        };
        return ListPickerModel;
    })(visto.ViewModel);
    exports.ListPickerModel = ListPickerModel;
});
//# sourceMappingURL=ListPickerModel.js.map
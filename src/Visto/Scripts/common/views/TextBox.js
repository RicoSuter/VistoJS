var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "./ValidationView"], function (require, exports, validationView) {
    var TextBox = (function (_super) {
        __extends(TextBox, _super);
        function TextBox() {
            _super.apply(this, arguments);
        }
        TextBox.prototype.onLoaded = function () {
            this.label = this.viewModel.label;
            this.value = this.viewModel.value;
            this.required = this.viewModel.required;
        };
        return TextBox;
    })(validationView.ValidationView);
    exports.TextBox = TextBox;
});
//# sourceMappingURL=TextBox.js.map
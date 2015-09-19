var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "libs/visto", "common/main"], function (require, exports, visto, common) {
    var SampleControlModel = (function (_super) {
        __extends(SampleControlModel, _super);
        function SampleControlModel() {
            _super.apply(this, arguments);
        }
        SampleControlModel.prototype.initialize = function () {
            var _this = this;
            this.selectedText = this.parameters.getObservableString("selectedText", "");
            this.transformedText = ko.computed(function () { return _this.selectedText().toUpperCase(); });
        };
        SampleControlModel.prototype.changeText = function () {
            var _this = this;
            common.prompt("Change text", "Please change the text: ", this.selectedText()).then(function (newText) {
                if (newText !== null)
                    _this.selectedText(newText);
            });
        };
        return SampleControlModel;
    })(visto.ViewModel);
    exports.SampleControlModel = SampleControlModel;
});
//# sourceMappingURL=SampleControlModel.js.map
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    "use strict";
    var PromptModel = (function (_super) {
        __extends(PromptModel, _super);
        function PromptModel() {
            _super.apply(this, arguments);
        }
        PromptModel.prototype.initialize = function (parameters) {
            this.title = parameters.getString("title");
            this.message = parameters.getString("message");
            this.output = parameters.getObservableString("output", "");
        };
        return PromptModel;
    }(visto.ViewModel));
    exports.PromptModel = PromptModel;
});
//# sourceMappingURL=PromptModel.js.map
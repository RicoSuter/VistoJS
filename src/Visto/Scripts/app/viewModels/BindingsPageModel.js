var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    "use strict";
    var BindingsPageModel = (function (_super) {
        __extends(BindingsPageModel, _super);
        function BindingsPageModel() {
            _super.apply(this, arguments);
        }
        BindingsPageModel.prototype.initialize = function () {
            this.selectedText = ko.observable("sample");
        };
        return BindingsPageModel;
    }(visto.ViewModel));
    exports.BindingsPageModel = BindingsPageModel;
    ;
});
//# sourceMappingURL=BindingsPageModel.js.map
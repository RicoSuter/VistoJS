var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "libs/visto", "common/validation"], function (require, exports, visto, validation) {
    var FormPage = (function (_super) {
        __extends(FormPage, _super);
        function FormPage() {
            _super.apply(this, arguments);
        }
        FormPage.prototype.onLoaded = function () {
            var form = $("form");
            var isValidComputable = validation.isFormValidComputable(form);
            this.subscribe(isValidComputable, function (valid) {
                console.log("Valid: " + valid);
            });
            console.log("Valid: " + validation.isFormValid(form));
        };
        return FormPage;
    })(visto.PageBase);
    exports.FormPage = FormPage;
});
//# sourceMappingURL=FormPage.js.map
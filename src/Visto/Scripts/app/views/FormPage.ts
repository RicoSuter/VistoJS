import visto = require("libs/visto");
import validation = require("common/validation");

export class FormPage extends visto.PageBase {
    onLoaded() {
        var form = $("form");

        var isValidComputable = validation.isFormValidComputable(form);
        this.subscribe(isValidComputable, (valid) => {
            console.log("Valid: " + valid);
        });
        console.log("Valid: " + validation.isFormValid(form));
    }
} 
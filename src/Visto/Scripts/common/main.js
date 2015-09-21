define(["require", "exports", "libs/visto", "module"], function (require, exports, visto, pkg) {
    /**
     * Registers common control aliases so that they can be used without specifying the common package.
     */
    function registerTagAliases() {
        visto.registerTagAlias("text-box", pkg, "TextBox");
        visto.registerTagAlias("check-box", pkg, "CheckBox");
        visto.registerTagAlias("button", pkg, "Button");
    }
    exports.registerTagAliases = registerTagAliases;
    /**
     * Shows a confirm dialog box with with various buttons.
     */
    function confirm(title, message, buttons) {
        var buttonCollection = [];
        if (buttons === Buttons.YesNoCancel || buttons === Buttons.YesNo) {
            buttonCollection.push({
                label: "Yes",
                click: function (dialog) {
                    dialog.close(visto.DialogResult.Yes);
                }
            });
        }
        if (buttons === Buttons.YesNoCancel || buttons === Buttons.YesNo) {
            buttonCollection.push({
                label: "No",
                click: function (dialog) {
                    dialog.close(visto.DialogResult.No);
                }
            });
        }
        if (buttons === Buttons.OkCancel || buttons === Buttons.Ok) {
            buttonCollection.push({
                label: "OK",
                click: function (dialog) {
                    dialog.close(visto.DialogResult.Ok);
                }
            });
        }
        if (buttons === Buttons.YesNoCancel || buttons === Buttons.OkCancel) {
            buttonCollection.push({
                label: "Cancel",
                click: function (dialog) {
                    dialog.close(visto.DialogResult.Cancel);
                }
            });
        }
        return visto.showDialog(visto.getViewName(pkg, "dialogs/Confirm"), {
            title: title,
            message: message,
            buttons: buttonCollection
        }).then(function (dialog) {
            return dialog.result;
        });
    }
    exports.confirm = confirm;
    ;
    (function (Buttons) {
        Buttons[Buttons["YesNoCancel"] = 0] = "YesNoCancel";
        Buttons[Buttons["YesNo"] = 1] = "YesNo";
        Buttons[Buttons["OkCancel"] = 2] = "OkCancel";
        Buttons[Buttons["Ok"] = 3] = "Ok";
    })(exports.Buttons || (exports.Buttons = {}));
    var Buttons = exports.Buttons;
    /**
     * Shows a progress bar in a dialog. The dialog can be controlled using the dialog instance in the completed callback.
     */
    function progressDialog(title) {
        return Q.Promise(function (resolve) {
            visto.showDialog(pkg, "dialogs/ProgressDialog", {
                title: title,
                resizable: false,
                draggable: true,
                dialogClass: "box no-close",
                modal: true,
                closeOnEscape: false
            }, function (view) {
                var progress = {
                    maximum: null,
                    value: 0,
                    setMaximum: function (maximum) {
                        progress.maximum = maximum;
                        progress.update();
                    },
                    setValue: function (value) {
                        progress.value = value;
                        progress.update();
                    },
                    close: function () {
                        view.close();
                    },
                    update: function () {
                        if (progress.maximum === null)
                            view.getViewElement("body").html("...");
                        else
                            view.getViewElement("body").html(progress.value + " / " + progress.maximum);
                    }
                };
                resolve(progress);
            });
        });
    }
    exports.progressDialog = progressDialog;
    ;
    ;
    /**
     * Shows an alert dialog box.
     */
    function alert(title, message) {
        return confirm(title, message, Buttons.Ok);
    }
    exports.alert = alert;
    ;
    /**
     * Shows an prompt dialog box to enter a string value. The promise value will be null if the user pressed the cancel button.
     */
    function prompt(title, message, defaultText) {
        var output = ko.observable(defaultText);
        return visto.showDialog(pkg, "dialogs/Prompt", {
            message: message,
            output: output,
            title: title
        }).then(function (dialog) {
            if (dialog.result === visto.DialogResult.Ok)
                return output();
            else
                return null;
        });
    }
    exports.prompt = prompt;
    ;
    /**
     * Shows a dialog with a list picker.
     */
    function listPicker(header, label, items, selectedItem, optionsText) {
        return visto.showDialog(pkg, "dialogs/ListPicker", {
            title: header,
            label: label,
            items: items,
            selectedItem: selectedItem,
            optionsText: optionsText
        }).then(function (dialog) {
            if (dialog.result === visto.DialogResult.Ok)
                return dialog.viewModel.selectedItem();
            else
                return null;
        });
    }
    exports.listPicker = listPicker;
    ;
});
//# sourceMappingURL=main.js.map
define(["require", "exports", "libs/visto", "module"], function (require, exports, visto, package) {
    /**
     * Shows a confirm dialog box with with various buttons.
     */
    function confirm(title, message, buttons) {
        var buttonCollection = [];
        if (buttons === 0 /* YesNoCancel */ || buttons === 1 /* YesNo */) {
            buttonCollection.push({
                label: "Yes",
                click: function (dialog) {
                    dialog.close(3 /* Yes */);
                }
            });
        }
        if (buttons === 0 /* YesNoCancel */ || buttons === 1 /* YesNo */) {
            buttonCollection.push({
                label: "No",
                click: function (dialog) {
                    dialog.close(4 /* No */);
                }
            });
        }
        if (buttons === 2 /* OkCancel */ || buttons === 3 /* Ok */) {
            buttonCollection.push({
                label: "OK",
                click: function (dialog) {
                    dialog.close(1 /* Ok */);
                }
            });
        }
        if (buttons === 0 /* YesNoCancel */ || buttons === 2 /* OkCancel */) {
            buttonCollection.push({
                label: "Cancel",
                click: function (dialog) {
                    dialog.close(2 /* Cancel */);
                }
            });
        }
        return visto.showDialog(visto.getViewName(package, "dialogs/Confirm"), {
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
            visto.showDialog(package, "dialogs/ProgressDialog", {
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
        return confirm(title, message, 3 /* Ok */);
    }
    exports.alert = alert;
    ;
    /**
     * Shows an prompt dialog box to enter a string value. The promise value will be null if the user pressed the cancel button.
     */
    function prompt(title, message, defaultText) {
        var output = ko.observable(defaultText);
        return visto.showDialog(package, "dialogs/Prompt", {
            message: message,
            output: output,
            title: title
        }).then(function (dialog) {
            if (dialog.result === 1 /* Ok */)
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
        return visto.showDialog(package, "dialogs/ListPicker", {
            title: header,
            label: label,
            items: items,
            selectedItem: selectedItem,
            optionsText: optionsText
        }).then(function (dialog) {
            if (dialog.result === 1 /* Ok */)
                return dialog.viewModel.selectedItem();
            else
                return null;
        });
    }
    exports.listPicker = listPicker;
    ;
});
//# sourceMappingURL=main.js.map
/*
    © 2017 Acsone SA/NV (http://www.acsone.eu)
    License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
*/


odoo.define('pos_cash_deposit.popups', function (require) {
    "use strict";

    var core = require('web.core');
    var Model = require('web.Model');
    var gui = require('point_of_sale.gui');
    var _t = core._t;

    var PopUpWidget = require('point_of_sale.popups');

    var CashDepositPopUpWidget = PopUpWidget.extend({
        template:'CashDepositPopUpWidget',
        events: {
            'click .close': 'close_popup',
            'click .validate-cash-deposit': 'validate_cash_deposit',
        },

        get_amount: function() {
            var self = this;
            return parseFloat(self.$("input[name='amount']").val());
        },

        get_message: function() {
            var self = this;
            return self.$("textarea[name='message']").val().trim();
        },

        get_customer: function() {
            var self = this;
            var currentOrder = self.pos.get('selectedOrder');
            return currentOrder.get_client();
        },

        close_popup: function() {
            var self = this;
            self.gui.close_popup();
        },

        validate_cash_deposit_data: function() {
            var self = this;
            return self.validate_amount()
                && self.validate_message()
                && self.validate_customer();
        },

        validate_amount: function() {
            var self = this;
            var amount = self.get_amount();
            var valid = $.isNumeric(amount) && amount > 0;
            if (!valid) {
                valid = false;
                self.gui.show_popup('error', {
                    'title': _t("Amount not valid"),
                    'body': _t("Amount must be a valid positive number."),
                });
            }
            return valid;
        },

        validate_message: function() {
            var self = this;
            var valid = !_.isEmpty(self.get_message());
            if (!valid) {
                self.gui.show_popup('error', {
                    'title': _t("Message"),
                    'body': _t("You must specify a reason in order to make a cash deposit."),
                });
            }
            return valid;
        },

        validate_customer: function() {
            var self = this;
            var valid = !!self.get_customer();
            if(!valid) {
                self.gui.show_popup('error', {
                    'title': _t("Customer"),
                    'body': _t("You must select a customer in order to make a cash deposit."),
                });
            }
            return valid;
        },

        validate_cash_deposit: function() {
            var self = this;
            var valid = self.validate_cash_deposit_data();

            if(valid) {
                var amount = self.get_amount();
                var message = self.get_message();
                self.create_cash_deposit(amount, message);
                self.gui.close_popup();
            }
        },

        create_cash_deposit: function (amount, message) {
            var self = this;
            var order = self.pos.get('selectedOrder');
            order.create_cash_deposit(amount, message);
        }

    });

    gui.define_popup({name:'cash-deposit', widget: CashDepositPopUpWidget});

    return {
        CashDepositPopUpWidget: CashDepositPopUpWidget,
    }
});
/*
    © 2017 Acsone SA/NV (https://www.acsone.eu)
    License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
*/

odoo.define('pos_cash_deposit.cash_deposit_widget', function (require) {
    "use strict";

    var core = require('web.core');
    var _t = core._t;

    var PosBaseWidget = require('point_of_sale.BaseWidget');

    var CashDepositWidget = PosBaseWidget.extend({
        template: 'CashDepositWidget',
        events: {
            'click .cash-deposit-button': 'open_cash_deposit_popup',
        },

        open_cash_deposit_popup: function() {
            var self = this;
            var customer = self.get_customer();

            if(!customer) {
                self.gui.show_popup('confirm',{
                    'title': _t('Please select the Customer'),
                    'body': _t("You need to select the customer before you can make a cash deposit."),
                    confirm: function(){
                        self.gui.show_screen('clientlist');
                    },
                });
            } else {
                self.gui.show_popup('cash-deposit');
            }
        },

        get_customer: function() {
            var self = this;
            var currentOrder = self.pos.get_order();
            return currentOrder.get_client();
        }

    });


    return CashDepositWidget;
});


odoo.define('pos_cash_deposit.screens', function (require) {
    "use strict";

    var core = require('web.core');

    var _t = core._t;

    var PosScreens = require('point_of_sale.screens');
    var CashDepositWidget = require('pos_cash_deposit.cash_deposit_widget');

    var PaymentScreenWidget = PosScreens.PaymentScreenWidget;
    var ProductListWidget = PosScreens.ProductListWidget;
    var ProductScreenWidget = PosScreens.ProductScreenWidget;

    PaymentScreenWidget.include({

        click_invoice: function() {
            var self = this;
            var order = self.pos.get_order();

            if (order.has_cash_deposit()) {
                self.gui.show_popup('error',{
                    'title': _t("Order not invoiceable"),
                    'body': _t("You can't invoice an order if it contains a cash deposit."),
                });
            } else {
                self._super.apply(self, arguments);
            }
        },

        order_is_valid: function(force_validation) {
            var self = this;
            var result = self._super.apply(self, force_validation);

            var order = this.pos.get_order();

            if(order.has_cash_deposit() && !order.get_client()) {
                this.gui.show_popup('error', {
                    'title': _t("Cash deposit with no customer."),
                    'body': _t("This order contains a cash deposit but is " +
                        "not link to any customer. Please select a customer " +
                        "or delete the cash deposit."),
                });
                return false;
            }
            return result;
        },

    });

    ProductScreenWidget.include({

        start: function() {
            var self = this;
            self._super.apply(self, arguments);

            self.cash_deposit_widget = undefined;
            if(self.pos.config.iface_cash_deposit) {
                self.cash_deposit_widget = new CashDepositWidget(self, {});
                self.cash_deposit_widget.replace(self.$('.placeholder-CashDepositWidget'));
            }
        },

    });

    ProductListWidget.include({

        set_product_list: function(product_list) {
            /*
            Remove the cash deposit product from the list
             */
            var self = this;
            var product = self.pos.config.cash_deposit_product;
            if(product) {
                product_list = _.without(product_list, product);
            }
            return self._super(product_list);
        },

    });
});
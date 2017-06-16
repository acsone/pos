/*
    © 2017 Acsone SA/NV (http://www.acsone.eu)
    License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
*/

odoo.define('pos_cash_deposit.models', function (require) {
"use strict";

    var core = require('web.core');
    var Model = require('web.Model');

    var PosModels = require('point_of_sale.models');

    var PosModel = PosModels.PosModel;
    var PosModelSuper = PosModel.prototype;

    var Order = PosModels.Order;
    var OrderSuper = Order.prototype;

    var OrderLine = PosModels.Orderline;
    var OrderLineSuper = OrderLine.prototype;

    PosModels.PosModel = PosModel.extend({
        initialize: function(session, attributes) {
            var self = this;
            self.load_cash_deposit_product_data();
            return PosModelSuper.initialize.call(self, session, attributes);
        },

        load_cash_deposit_product_data: function() {
            this.models.push({
                label: 'cash_deposit_data',
                loaded: function (self) {
                    var pos_config = self.config;
                    var cash_deposit_product = pos_config.cash_deposit_product_id;
                    var data_loaded;

                    if (!cash_deposit_product) {
                        data_loaded = new $.Deferred();
                    } else {
                        data_loaded = new Model('product.product').call('read', [
                            cash_deposit_product[0],
                            ['display_name', 'list_price', 'price', 'pos_categ_id',
                                'taxes_id', 'barcode', 'default_code', 'to_weight',
                                'uom_id', 'description_sale', 'description',
                                'product_tmpl_id', 'tracking',]
                        ]).then(function (data) {
                            var product_data = data[0];
                            pos_config.cash_deposit_product = product_data;
                            // TODO: find better way or we have to loop
                            // on all products in product list to
                            self.db.add_products(data);
                        });
                    }
                    return data_loaded;
                },
            })
        },

        push_and_invoice_order: function(order) {
            var self = this;
            var invoiced = new $.Deferred();

            if (order.has_cash_deposit()) {
                invoiced.reject({
                    code: 400,
                    message: 'Cash deposit',
                    data: {}
                });
                return invoiced;
            }
            return PosModelSuper.push_and_invoice_order.call(self, order);
        }

    });


    PosModels.Order = Order.extend({

        is_to_invoice: function() {
            var self = this;
            return OrderSuper.is_to_invoice.call(self) && !self.has_cash_deposit();
        },

        has_cash_deposit: function() {
            var self = this;
            var orderline;
            var order_lines = self.get_orderlines();
            for(var i=0; i < order_lines.length; i++) {
                orderline = order_lines[i];
                if(orderline.is_cash_deposit()) {
                    return true;
                }
            }
            return false;
        },

        create_cash_deposit: function(amount, message) {
            var self = this;
            var cash_deposit_product = self.pos.config.cash_deposit_product;
            self.add_product(cash_deposit_product, {
                quantity: 1,
                price: amount,
                extras: {
                    cash_deposit_msg: message,
                }
            });
        }
    });

    PosModels.Orderline = OrderLine.extend({
        initialize: function (session, attributes) {
            var self = this;
            self.cash_deposit_msg = false;
            return OrderLineSuper.initialize.call(self, session, attributes);
        },

        can_be_merged_with: function (orderline) {
            var self = this;
            return !self.is_cash_deposit() && OrderLineSuper.can_be_merged_with.call(self, orderline);
        },

        is_cash_deposit: function() {
            var self = this;
            return self.product.id === self.pos.config.cash_deposit_product.id;
        },

        get_cash_deposit_message: function() {
            var self = this;
            return !self.cash_deposit_msg ? '' : self.cash_deposit_msg;
        },

        init_from_JSON: function(json) {
            var self = this;
            OrderLineSuper.init_from_JSON.call(self, json);
            self.cash_deposit_msg = json.cash_deposit_msg;
        },

        export_as_JSON: function() {
            var self = this;
            var json_repr = OrderLineSuper.export_as_JSON.call(self, arguments);
            json_repr.cash_deposit_msg = self.get_cash_deposit_message();
            return json_repr;
        },

        export_for_printing: function() {
            var self = this;
            var json_repr = OrderLineSuper.export_for_printing.call(self, arguments);
            json_repr.cash_deposit_msg = self.get_cash_deposit_message();
            return json_repr;
        }
    });


});

odoo.define("pos_product_multi_price.models", function(require) {
    "use strict";

    var models = require("point_of_sale.models");
    var core = require("web.core");
    var utils = require("web.utils");

    var round_pr = utils.round_precision;
    var _t = core._t;

    models.load_fields("product.product", ["price_ids_json"]);

    models.Product = models.Product.extend({
        get_price: function(pricelist, quantity) {
            // Partially copied from "point_of_sale.models"

            var self = this;
            var price_ids_json = JSON.parse(this.price_ids_json);
            var price = self.lst_price;

            var date = moment().startOf("day");

            if (pricelist === undefined) {
                alert(
                    _t(
                        "An error occurred when loading product prices. " +
                            "Make sure all pricelists are available in the POS."
                    )
                );
            }

            var category_ids = [];
            var category = this.categ;
            while (category) {
                category_ids.push(category.id);
                category = category.parent;
            }
            var pricelist_items = _.filter(pricelist.items, function(item) {
                return (
                    (!item.product_tmpl_id ||
                        item.product_tmpl_id[0] === self.product_tmpl_id) &&
                    (!item.product_id || item.product_id[0] === self.id) &&
                    (!item.categ_id || _.contains(category_ids, item.categ_id[0])) &&
                    (!item.date_start ||
                        moment(item.date_start).isSameOrBefore(date)) &&
                    (!item.date_end || moment(item.date_end).isSameOrAfter(date))
                );
            });
            _.find(pricelist_items, function(rule) {
                if (rule.min_quantity && quantity < rule.min_quantity) {
                    return false;
                }

                if (rule.base === "pricelist") {
                    price = self.get_price(rule.base_pricelist, quantity);
                } else if (rule.base === "standard_price") {
                    price = self.standard_price;
                }

                if (rule.compute_price === "fixed") {
                    price = rule.fixed_price;
                    return true;
                } else if (rule.compute_price === "percentage") {
                    price -= price * (rule.percent_price / 100);
                    return true;
                } else if (
                    rule.base === "multi_price" &&
                    rule.compute_price === "formula"
                ) {
                    _.forEach(price_ids_json, function(multi_price) {
                        if (multi_price.price_id === rule.multi_price_name[0]) {
                            price = multi_price.price;
                            var price_limit = price;
                            price -= price * (rule.price_discount / 100);
                            if (rule.price_round) {
                                price = round_pr(price, rule.price_round);
                            }
                            if (rule.price_surcharge) {
                                price += rule.price_surcharge;
                            }
                            if (rule.price_min_margin) {
                                price = Math.max(
                                    price,
                                    price_limit + rule.price_min_margin
                                );
                            }
                            if (rule.price_max_margin) {
                                price = Math.min(
                                    price,
                                    price_limit + rule.price_max_margin
                                );
                            }
                            return true;
                        }
                    });
                } else {
                    var price_limit = price;
                    price -= price * (rule.price_discount / 100);
                    if (rule.price_round) {
                        price = round_pr(price, rule.price_round);
                    }
                    if (rule.price_surcharge) {
                        price += rule.price_surcharge;
                    }
                    if (rule.price_min_margin) {
                        price = Math.max(price, price_limit + rule.price_min_margin);
                    }
                    if (rule.price_max_margin) {
                        price = Math.min(price, price_limit + rule.price_max_margin);
                    }
                    return true;
                }

                return false;
            });
            return price;
        },
    });
});

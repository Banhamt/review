/* © 2026 Tim Banham. All rights reserved. */
(function (R) {
  'use strict';
  var add = R.add, need = R.need, N = R.N, M = R.M, coef = R.coef, xp = R.xp, ekx = R.ekx, zeros = R.zeros,
      fac = R.fac, ord = R.ord, lin = R.lin, poly = R.poly, cubicFromRoots = R.cubicFromRoots;
    var RIVER = '[[plot plain; x=0..9; y=0..8; x=2.2+0.15sin(3y) on 0.6..7.4; seg(2.6,1.6)(6.6,1.6)(6.6,6.4)(2.6,6.4); label(4.6,1.6,x,below); label(4.6,6.4,x); label(6.6,4,y,right); label(1.9,4,river,left)]]';

  add('t-river-area', function (r) {
    var L = 24 * r.int(2, 10);                              // 2x + y = L, A = x(L - 2x)  ->  x = L/4
    return {
      prompt: 'A farmer has ' + L + ' ft of fence for a rectangle along a river, with no fence along the river. ' +
              'Which $x$ gives the largest area? ' + RIVER,
      answer: '$x=' + L / 4 + '$ ft',
      wrong: ['$x=' + L / 2 + '$ ft', '$x=' + L / 3 + '$ ft', '$x=' + L / 8 + '$ ft', '$x=' + L / 6 + '$ ft', '$x=' + L / 12 + '$ ft']
    };
  });

  add('t-river-setup', function (r) {
    var A = r.pick([200, 450, 600, 800, 1250, 1800]);
    return {
      prompt: 'A rectangle along a river must have area ' + A + ' ft², with no fence along the river. ' +
              'Which function of $x$ gives the fence length to minimize? ' + RIVER,
      answer: '$F(x)=2x+\\dfrac{' + A + '}{x}$',
      wrong: ['$F(x)=x+\\dfrac{' + A + '}{x}$', '$F(x)=2x+\\dfrac{' + 2 * A + '}{x}$', '$F(x)=2x+' + A + 'x$',
              '$F(x)=x+\\dfrac{' + 2 * A + '}{x}$', '$F(x)=2x(' + A + '-2x)$']
    };
  });

  add('t-pens-setup', function (r) {
    var A = r.pick([300, 600, 900, 1200, 1500]), n = r.pick([2, 3]);
    var divs = n === 2 ? 'seg(4,1)(4,5)' : 'seg(3,1)(3,5); seg(5,1)(5,5)';
    var pic = '[[plot plain; x=0..8; y=0..6; seg(1,1)(7,1)(7,5)(1,5)(1,1); ' + divs + '; label(4,1,x,below); label(1,3,y,left)]]';
    return {
      prompt: 'A rectangular dog run of area ' + A + ' ft² is split into ' + n + ' pens by fences parallel to the sides, as shown. ' +
              'Which function of $x$ gives the total fence length? ' + pic,
      answer: '$F(x)=2x+\\dfrac{' + (n + 1) * A + '}{x}$',
      wrong: ['$F(x)=2x+\\dfrac{' + n * A + '}{x}$', '$F(x)=2x+\\dfrac{' + 2 * A + '}{x}$', '$F(x)=' + (n + 1) + 'x+\\dfrac{' + 2 * A + '}{x}$',
              '$F(x)=2x+' + (n + 1) * A + 'x$', '$F(x)=2x+\\dfrac{' + A + '}{x}$']
    };
  });

  add('t-box-setup', function (r) {
    var V = r.pick([4, 32, 108, 256, 500]);
    return {
      prompt: 'An open-top box with a square base (side $x$, height $h$) must hold ' + V + ' ft³. Which function of $x$ gives the surface area to minimize?',
      answer: '$S(x)=x^{2}+\\dfrac{' + 4 * V + '}{x}$',
      wrong: ['$S(x)=x^{2}+\\dfrac{' + V + '}{x}$', '$S(x)=2x^{2}+\\dfrac{' + 4 * V + '}{x}$', '$S(x)=x^{2}+\\dfrac{' + 4 * V + '}{x^{2}}$',
              '$S(x)=x^{2}+' + 4 * V + 'x$', '$S(x)=x^{2}+\\dfrac{' + 2 * V + '}{x}$']
    };
  });

  add('t-inventory-setup', function (r) {
    var D = 300 * r.int(2, 12), K = r.pick([10, 20, 25, 30, 40, 50]), s = r.pick([2, 4, 6, 8, 10]);
    var thing = r.pick(['snow shovels', 'helmets', 'printers', 'tires', 'backpacks']);
    return {
      prompt: 'A store sells ' + D + ' ' + thing + ' a year. Each order costs ' + M(K) + ' to place, and storing one for a year costs ' + M(s) +
              '. If it orders $x$ at a time (average inventory $x/2$), which is the yearly inventory cost?',
      answer: '$C(x)=\\dfrac{' + D * K + '}{x}+' + coef(s / 2) + 'x$',
      wrong: ['$C(x)=\\dfrac{' + D + '}{x}+' + coef(s / 2) + 'x$', '$C(x)=\\dfrac{' + D * K + '}{x}+' + coef(s) + 'x$',
              '$C(x)=' + coef(K) + 'x+\\dfrac{' + D * s / 2 + '}{x}$', '$C(x)=\\dfrac{' + D * K / 2 + '}{x}+' + coef(s) + 'x$']
    };
  });

  add('t-orders-per-year', function (r) {
    var x = r.pick([20, 40, 50, 60, 80, 100, 120, 150, 200]), B = r.pick([1, 2, 2.5, 3, 4, 5]), n = r.pick([4, 5, 6, 8, 10, 12, 15]);
    var A = B * x * x, D = n * x;
    return {
      prompt: 'A store sells ' + D + ' items a year. Its yearly inventory cost is $C(x)=\\dfrac{' + N(A) + '}{x}+' + coef(B) +
              'x$, where $x$ is the number of items per order. How many orders per year minimize the cost?',
      answer: n + ' orders',
      wrong: [x + ' orders', 2 * n + ' orders', N(A / D) + ' orders', N(n / 2) + ' orders', N(D / 2) + ' orders']
    };
  });

  add('t-order-size', function (r) {
    var x = r.pick([20, 30, 40, 50, 60, 80, 100, 120, 150, 200]), B = r.pick([1, 2, 2.5, 3, 4, 5]);
    var A = B * x * x;
    return {
      prompt: 'A store\'s yearly inventory cost is $C(x)=\\dfrac{' + N(A) + '}{x}+' + coef(B) + 'x$ dollars, where $x$ is the number of items per order. ' +
              'How many items per order minimize the cost?',
      answer: x + ' items',
      wrong: [N(A / B) + ' items', 2 * x + ' items', x / 2 + ' items', N(Math.round(Math.sqrt(A))) + ' items', N(A / (2 * B)) + ' items']
    };
  });

  add('t-min-inventory-cost', function (r) {
    var x = r.pick([20, 30, 40, 50, 60, 80, 100, 120, 150, 200]), B = r.pick([1, 2, 2.5, 3, 4, 5]), A = B * x * x;
    return {
      prompt: 'A store\'s yearly inventory cost is $C(x)=\\dfrac{' + N(A) + '}{x}+' + coef(B) + 'x$ dollars, where $x$ is the number of items per order. ' +
              'What is the minimum yearly inventory cost?',
      answer: M(2 * B * x),
      wrong: [M(B * x), M(x), M(4 * B * x), M(2.5 * B * x), M(A / B)]
    };
  });

})(window.Review);


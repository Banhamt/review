/* © 2026 Tim Banham. All rights reserved. */
(function (R) {
  'use strict';
  var add = R.add, need = R.need, N = R.N, M = R.M;
  var RATES = [0.02, 0.03, 0.04, 0.05, 0.06, 0.08];
  function pct(r) { return N(r * 100) + '%'; }
  function dA(rhs) { return '\\dfrac{dA}{dt}=' + rhs; }

  add('t-de-separate', function (r) {
    var rate = r.pick(RATES);
    return {
      prompt: 'Separate the variables in $' + dA(N(rate) + 'A') + '$ (A on the left, t on the right).',
      answer: '$\\dfrac{1}{A}\\,dA=' + N(rate) + '\\,dt$',
      wrong: ['$A\\,dA=' + N(rate) + '\\,dt$', '$\\dfrac{1}{' + N(rate) + '}\\,dA=A\\,dt$', '$dA=' + N(rate) + '\\,dt$',
              '$\\dfrac{1}{A}\\,dA=' + N(rate) + 't\\,dt$', '$' + N(rate) + 'A\\,dA=dt$']
    };
  });

  add('t-de-integrate', function (r) {
    if (r.int(0, 1)) {
      var rate = r.pick(RATES), P = r.pick([500, 1000, 1500, 2000, 3000, 5000]), u = N(rate) + 'A+' + P;
      return {
        prompt: 'Separating $' + dA(N(rate) + 'A+' + P) + '$ gives $\\dfrac{1}{' + u + '}\\,dA=dt$. Using $u=' + u +
                '$, what is $\\displaystyle\\int\\dfrac{1}{' + u + '}\\,dA$?',
        answer: '$\\dfrac{1}{' + N(rate) + '}\\ln\\left(' + u + '\\right)+C$',
        wrong: ['$\\ln\\left(' + u + '\\right)+C$', '$' + N(rate) + '\\ln\\left(' + u + '\\right)+C$',
                '$\\dfrac{1}{' + N(rate) + '}\\left(' + u + '\\right)^{-1}+C$', '$\\dfrac{1}{' + N(rate) + '}\\ln\\left(A\\right)+C$',
                '$\\dfrac{1}{' + P + '}\\ln\\left(' + u + '\\right)+C$']
      };
    }
    var P2 = r.pick([200, 300, 500, 800, 1200]), A0 = r.pick([100, 250, 400, 1000, 1500]);
    return {
      prompt: 'You add \\$' + P2 + ' per year to a jar that starts with \\$' + A0 + ', so $' + dA(P2) + '$ and $A(0)=' + A0 +
              '$. Which is the model?',
      answer: '$A(t)=' + P2 + 't+' + A0 + '$',
      wrong: ['$A(t)=' + P2 + 't$', '$A(t)=' + A0 + 't+' + P2 + '$', '$A(t)=' + A0 + 'e^{' + P2 + 't}$', '$A(t)=' + P2 + '+' + A0 + '$',
              '$A(t)=' + (P2 + A0) + 't$']
    };
  });

  add('t-de-interest-model', function (r) {
    var rate = r.pick(RATES), A0 = r.pick([1000, 2000, 2500, 4000, 5000, 6000, 8000, 10000]);
    return {
      prompt: 'An account earns ' + pct(rate) + ' interest compounded continuously, so $' + dA(N(rate) + 'A') + '$ with $A(0)=' + A0 +
              '$. Which is the model?',
      answer: '$A(t)=' + A0 + 'e^{' + N(rate) + 't}$',
      wrong: ['$A(t)=e^{' + N(rate) + 't}+' + A0 + '$', '$A(t)=' + A0 + 'e^{t}$', '$A(t)=' + N(rate * A0) + 'e^{' + N(rate) + 't}$',
              '$A(t)=' + A0 + '+' + N(rate) + 't$', '$A(t)=' + A0 + '(1+' + N(rate) + ')^{t}$']
    };
  });

  add('t-de-interest-value', function (r) {
    var rate = r.pick(RATES), A0 = r.pick([1000, 2000, 2500, 4000, 5000, 6000, 8000]), t = r.pick([5, 8, 10, 12, 15, 20]);
    var v = A0 * Math.exp(rate * t);
    return {
      prompt: 'You put ' + M(A0) + ' into an account earning ' + pct(rate) + ' interest compounded continuously, so $A(t)=' + A0 +
              'e^{' + N(rate) + 't}$. How much is in the account after ' + t + ' years?',
      answer: M(v),
      wrong: [M(A0 * Math.pow(1 + rate, t)), M(A0 * (1 + rate * t)), M(A0 * Math.exp(rate) * t), M(v - A0)]
    };
  });

  add('t-de-stream-model', function (r) {
    var rate = r.pick(RATES), P = r.pick([500, 1000, 1200, 1500, 2000, 2400, 3000, 5000]), k = P / rate;
    need(Number.isInteger(k));
    return {
      prompt: 'An account starts with \\$0, earns ' + pct(rate) + ' interest compounded continuously, and you deposit \\$' + P +
              ' per year continuously: $' + dA(N(rate) + 'A+' + P) + '$, $A(0)=0$. Which is the model?',
      answer: '$A(t)=' + k + '\\left(e^{' + N(rate) + 't}-1\\right)$',
      wrong: ['$A(t)=' + k + 'e^{' + N(rate) + 't}$', '$A(t)=' + P + '\\left(e^{' + N(rate) + 't}-1\\right)$',
              '$A(t)=' + P + 'e^{' + N(rate) + 't}$', '$A(t)=' + k + '\\left(e^{t}-1\\right)$', '$A(t)=' + k + '\\left(1-e^{' + N(rate) + 't}\\right)$']
    };
  });

  add('t-de-stream-value', function (r) {
    var rate = r.pick(RATES), P = r.pick([500, 1000, 1200, 1500, 2000, 2400, 3000, 5000]), t = r.pick([5, 8, 10, 12, 15, 20]), k = P / rate;
    need(Number.isInteger(k));
    var g = Math.exp(rate * t);
    return {
      prompt: 'With $A(t)=' + k + '\\left(e^{' + N(rate) + 't}-1\\right)$ (' + M(P) + ' per year deposited continuously at ' + pct(rate) +
              '), how much is in the account after ' + t + ' years?',
      answer: M(k * (g - 1)),
      wrong: [M(k * g), M(P * t), M(P * (g - 1)), M(P * t * g)]
    };
  });

})(window.Review);


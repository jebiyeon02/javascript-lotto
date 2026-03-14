(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const LOTTO = {
  UPPER: 45,
  LOWER: 1,
  COUNT: 6,
  PRICE: 1e3
};
const ERROR_MESSAGE = {
  PREFIX: "[ERROR]",
  EMPTY_STRING: "빈 값을 입력할 수 없습니다.",
  NOT_POSITIVE_NUMBER: "양의 정수만 입력 가능합니다.",
  OVER_UPPER: "입력된 값이 유효범위보다 큽니다.",
  UNDER_LOWER: "입력된 값이 유효범위보다 작습니다.",
  NOT_NUMBER: "숫자만 입력 가능합니다.",
  NOT_DIVIDED: "나누어 떨어져야 합니다",
  DUPLICATED: "중복된 값이 존재합니다.",
  INVALID_ARRAY_LENGTH: "유효하지 않은 개수입니다.",
  NOT_INCLUDED: "유효하지 않은 입력입니다.",
  BONUS_NUMBER_DUPLICATED: "보너스 번호가 당첨번호와 중복됩니다."
};
const RANK = {
  FIRST: {
    DISPLAY: "FIRST",
    MATCH_COUNT: 6,
    MUST_HAVE_BONUS: false,
    PRICE: 2e9
  },
  SECOND: {
    DISPLAY: "SECOND",
    MATCH_COUNT: 5,
    MUST_HAVE_BONUS: true,
    PRICE: 3e7
  },
  THIRD: {
    DISPLAY: "THIRD",
    MATCH_COUNT: 5,
    MUST_HAVE_BONUS: false,
    PRICE: 15e5
  },
  FOURTH: {
    DISPLAY: "FOURTH",
    MATCH_COUNT: 4,
    MUST_HAVE_BONUS: false,
    PRICE: 5e4
  },
  FIFTH: {
    DISPLAY: "FIFTH",
    MATCH_COUNT: 3,
    MUST_HAVE_BONUS: false,
    PRICE: 5e3
  }
};
const getRandomNumber = (min, max) => {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
};
const getErrorMessage = (errorMesasge) => {
  return `${ERROR_MESSAGE.PREFIX} ${errorMesasge}`;
};
const Validator = {
  notEmptyString(string) {
    if (string.trim() === "") {
      throw new Error(getErrorMessage(ERROR_MESSAGE.EMPTY_STRING));
    }
  },
  positiveNumber(number) {
    if (number <= 0) {
      throw new Error(getErrorMessage(ERROR_MESSAGE.NOT_POSITIVE_NUMBER));
    }
  },
  numberUpper(upper, number) {
    if (number > upper) {
      throw new Error(getErrorMessage(ERROR_MESSAGE.OVER_UPPER));
    }
  },
  numberLower(lower, number) {
    if (number < lower) {
      throw new Error(getErrorMessage(ERROR_MESSAGE.UNDER_LOWER));
    }
  },
  stringIsNumber(string) {
    const parsedNumber = Number(string);
    if (Number.isNaN(parsedNumber)) {
      throw new Error(getErrorMessage(ERROR_MESSAGE.NOT_NUMBER));
    }
  },
  numberDivided(number, divideNumber) {
    if (number % divideNumber !== 0) {
      throw new Error(getErrorMessage(ERROR_MESSAGE.NOT_DIVIDED));
    }
  },
  notDuplicated(array) {
    if (array.length !== new Set(array).size) {
      throw new Error(getErrorMessage(ERROR_MESSAGE.DUPLICATED));
    }
  },
  arrayLength(array, length) {
    if (array.length !== length) {
      throw new Error(getErrorMessage(ERROR_MESSAGE.INVALID_ARRAY_LENGTH));
    }
  },
  includeElement(targetElement, array) {
    if (!array.includes(targetElement))
      throw new Error(getErrorMessage(ERROR_MESSAGE.NOT_INCLUDED));
  }
};
class Lotto {
  #numbers;
  constructor(randomNumbers) {
    randomNumbers.forEach((randomNumber) => {
      Validator.positiveNumber(randomNumber);
      Validator.numberLower(LOTTO.LOWER, randomNumber);
      Validator.numberUpper(LOTTO.UPPER, randomNumber);
    });
    Validator.notDuplicated(randomNumbers);
    Validator.arrayLength(randomNumbers, LOTTO.COUNT);
    this.#numbers = randomNumbers.toSorted((a, b) => a - b);
  }
  hasNumber(targetNumber) {
    return this.#numbers.includes(targetNumber);
  }
  getNumbers() {
    return [...this.#numbers];
  }
}
const LottoGenerator = {
  calculateBuyLottoCount(money) {
    return money / LOTTO.PRICE;
  },
  getRandomLottoNumbers() {
    const randomNumbers = [];
    while (randomNumbers.length !== LOTTO.COUNT) {
      const randomNumber = getRandomNumber(LOTTO.LOWER, LOTTO.UPPER);
      if (randomNumbers.includes(randomNumber)) continue;
      randomNumbers.push(randomNumber);
    }
    return randomNumbers;
  },
  makeLottos(buyLottoCount) {
    return Array.from(
      { length: buyLottoCount },
      () => new Lotto(LottoGenerator.getRandomLottoNumbers())
    );
  }
};
class WinningLotto {
  #lotto;
  #bonusNumber;
  constructor(winningNumbers, bonusNumber) {
    this.#lotto = new Lotto(winningNumbers);
    this.#validateBonusNumber(bonusNumber);
    this.#bonusNumber = bonusNumber;
  }
  #validateBonusNumber(bonusNumber) {
    if (this.#lotto.hasNumber(bonusNumber)) {
      throw new Error(getErrorMessage(ERROR_MESSAGE.BONUS_NUMBER_DUPLICATED));
    }
  }
  getMatchCount(lotto) {
    const winningNumbers = this.#lotto.getNumbers();
    const matchedNumbers = winningNumbers.filter(
      (number) => lotto.hasNumber(number)
    );
    return matchedNumbers.length;
  }
  hasBonus(lotto) {
    return lotto.hasNumber(this.#bonusNumber);
  }
}
const ScoreBoard = {
  getRank(matchCount, hasBonus) {
    if (matchCount === RANK.FIRST.MATCH_COUNT) {
      return RANK.FIRST.DISPLAY;
    }
    if (matchCount === RANK.SECOND.MATCH_COUNT && hasBonus) {
      return RANK.SECOND.DISPLAY;
    }
    if (matchCount === RANK.THIRD.MATCH_COUNT) {
      return RANK.THIRD.DISPLAY;
    }
    if (matchCount === RANK.FOURTH.MATCH_COUNT) {
      return RANK.FOURTH.DISPLAY;
    }
    if (matchCount === RANK.FIFTH.MATCH_COUNT) {
      return RANK.FIFTH.DISPLAY;
    }
  },
  makeAllRankCount(lottos, winningLotto) {
    const allRankCount = {
      FIRST: 0,
      SECOND: 0,
      THIRD: 0,
      FOURTH: 0,
      FIFTH: 0
    };
    lottos.forEach((lotto) => {
      const matchCount = winningLotto.getMatchCount(lotto);
      const hasBonus = winningLotto.hasBonus(lotto);
      allRankCount[ScoreBoard.getRank(matchCount, hasBonus)]++;
    });
    return allRankCount;
  },
  getProfitRate(allRankCount, money) {
    const totalProfit = allRankCount[RANK.FIRST.DISPLAY] * RANK.FIRST.PRICE + allRankCount[RANK.SECOND.DISPLAY] * RANK.SECOND.PRICE + allRankCount[RANK.THIRD.DISPLAY] * RANK.THIRD.PRICE + allRankCount[RANK.FOURTH.DISPLAY] * RANK.FOURTH.PRICE + allRankCount[RANK.FIFTH.DISPLAY] * RANK.FIFTH.PRICE;
    return (totalProfit / money * 100).toFixed(1);
  }
};
class PurchaseView {
  #form;
  #input;
  #submitButton;
  constructor() {
    this.#form = document.querySelector(".purchase-form");
    this.#input = document.querySelector(".purchase-form__input");
    this.#submitButton = document.querySelector(".purchase-form__submit-btn");
  }
  init() {
    this.#form.reset();
    this.#input.disabled = false;
    this.#input.style.cursor = "";
    this.#submitButton.disabled = false;
    this.#submitButton.style.cursor = "pointer";
  }
  disableForm() {
    this.#input.disabled = true;
    this.#input.style.cursor = "not-allowed";
    this.#submitButton.disabled = true;
    this.#submitButton.style.cursor = "not-allowed";
  }
  removeInputValue() {
    this.#input.value = "";
  }
  focusInput() {
    this.#input.focus();
  }
  readMoney() {
    const rawMoney = this.#input.value;
    Validator.notEmptyString(rawMoney);
    Validator.stringIsNumber(rawMoney);
    const money = Number(rawMoney);
    return money;
  }
  bindSubmitButton(successSubmit) {
    this.#form.addEventListener("submit", (e) => {
      e.preventDefault();
      successSubmit();
    });
  }
}
class ResultModalView {
  #modal;
  #closeButton;
  #tbody;
  #profit;
  #submitButton;
  constructor() {
    this.#modal = document.querySelector(".result-modal");
    this.#closeButton = document.querySelector(".result-modal__close-btn");
    this.#tbody = document.querySelector(".result-modal__tbody");
    this.#profit = document.querySelector(".result-modal__profit");
    this.#submitButton = document.querySelector(".result-modal__submit-btn");
  }
  open() {
    this.#modal.showModal();
  }
  close() {
    this.#modal.close();
  }
  bindCloseButton() {
    this.#closeButton.addEventListener("click", (e) => {
      this.#modal.close();
    });
  }
  bindSubmitButton(successSubmit) {
    this.#submitButton.addEventListener("click", (e) => {
      this.#modal.close();
      successSubmit();
    });
  }
  renderScore(scoreData) {
    this.#tbody.innerHTML = "";
    const fragment = new DocumentFragment();
    scoreData.forEach(({ matchCount, mustHaveBonus, price, winCount }) => {
      const tr = document.createElement("tr");
      tr.classList.add("result-modal__tr", "body");
      const tdMatchCount = document.createElement("td");
      const tdPrice = document.createElement("td");
      const tdWinCount = document.createElement("td");
      tdMatchCount.className = "result-modal__td";
      tdMatchCount.textContent = `${matchCount}개`;
      if (mustHaveBonus) {
        tdMatchCount.textContent += "+보너스볼";
      }
      tdPrice.className = "result-modal__td";
      tdPrice.textContent = price.toLocaleString();
      tdWinCount.className = "result-modal__td";
      tdWinCount.textContent = `${winCount}개`;
      tr.append(tdMatchCount);
      tr.append(tdPrice);
      tr.append(tdWinCount);
      fragment.prepend(tr);
    });
    this.#tbody.append(fragment);
  }
  renderProfitRate(profitRate) {
    this.#profit.textContent = `당신의 총 수익률은 ${profitRate}%입니다.`;
  }
}
class TicketListView {
  #list;
  #summary;
  #container;
  constructor() {
    this.#list = document.querySelector(".ticket-list");
    this.#summary = document.querySelector(".ticket-list__summary");
    this.#container = document.querySelector(".ticket-list__container");
  }
  init() {
    this.#container.innerHTML = "";
    this.hide();
  }
  show() {
    this.#list.style.visibility = "visible";
  }
  hide() {
    this.#list.style.visibility = "hidden";
  }
  renderAllTickets(allLottoNumbers) {
    allLottoNumbers.forEach(
      (lottoNumber) => this.#container.appendChild(this.#getTicket(lottoNumber))
    );
  }
  renderPurchaseLottoCount(purchaseLottoCount) {
    this.#summary.innerText = `총 ${purchaseLottoCount}개를 구매하였습니다.`;
  }
  #getTicket(lottoNumbers) {
    const ticket = document.createElement("div");
    ticket.className = "ticket-list__item";
    const ticketIcon = document.createElement("img");
    ticketIcon.className = "ticket-list__icon";
    ticketIcon.src = "./assets/lotto_ticket.png";
    const lottoNumberSpan = document.createElement("span");
    lottoNumberSpan.className = "ticket-list__numbers";
    const numberText = document.createTextNode(lottoNumbers.join(", "));
    lottoNumberSpan.appendChild(numberText);
    ticket.appendChild(ticketIcon);
    ticket.appendChild(lottoNumberSpan);
    return ticket;
  }
}
class WinningLottoView {
  #form;
  #winningNumberInputs;
  #bonusNumberInput;
  #allNumbersInput;
  constructor() {
    this.#form = document.querySelector(".winning-form");
    this.#winningNumberInputs = document.querySelectorAll(
      ".winning-form__input:not(.winning-form__input--bonus)"
    );
    this.#bonusNumberInput = document.querySelector(
      ".winning-form__input--bonus"
    );
    this.#allNumbersInput = [
      ...this.#winningNumberInputs,
      this.#bonusNumberInput
    ];
  }
  init() {
    this.#form.reset();
    this.hide();
    this.#allNumbersInput.forEach((node) => {
      node.disabled = false;
      node.style.cursor = "";
    });
  }
  show() {
    this.#form.style.visibility = "visible";
  }
  hide() {
    this.#form.style.visibility = "hidden";
  }
  focusInput(index) {
    const targetInputNode = this.#allNumbersInput.find(
      (_, idx) => index === idx
    );
    targetInputNode.focus();
  }
  disableInputs() {
    this.#allNumbersInput.forEach((node) => {
      node.disabled = true;
      node.style.cursor = "not-allowed";
    });
  }
  readWinningNumbers() {
    const rawWinningNumbers = Array.from(
      this.#winningNumberInputs,
      (node) => node.value
    );
    const winningNumbers = rawWinningNumbers.map((string) => {
      Validator.notEmptyString(string);
      Validator.stringIsNumber(string);
      return Number(string);
    });
    return winningNumbers;
  }
  readBonusNumber() {
    const rawBonusNumber = this.#bonusNumberInput.value;
    Validator.notEmptyString(rawBonusNumber);
    Validator.stringIsNumber(rawBonusNumber);
    const bonusNumber = Number(rawBonusNumber);
    return bonusNumber;
  }
  bindSubmitButton(successSubmit) {
    this.#form.addEventListener("submit", (e) => {
      e.preventDefault();
      successSubmit();
    });
  }
}
class App {
  #lottos;
  #money;
  #winningLotto;
  #purchaseView;
  #ticketListView;
  #winningLottoView;
  #resultModalView;
  constructor() {
    this.#lottos = [];
    this.#purchaseView = new PurchaseView();
    this.#ticketListView = new TicketListView();
    this.#winningLottoView = new WinningLottoView();
    this.#resultModalView = new ResultModalView();
  }
  run() {
    this.#purchaseView.bindSubmitButton(this.#handleSubmitPurchase);
    this.#winningLottoView.bindSubmitButton(this.#handleSubmitWinningLotto);
    this.#resultModalView.bindCloseButton();
    this.#resultModalView.bindSubmitButton(this.#initLotttGame);
  }
  #initLotttGame = () => {
    this.#lottos = [];
    this.#ticketListView.init();
    this.#purchaseView.init();
    this.#winningLottoView.init();
  };
  #handleSubmitPurchase = () => {
    try {
      const money = this.#purchaseView.readMoney();
      Validator.numberDivided(money, LOTTO.PRICE);
      Validator.positiveNumber(money);
      this.#money = money;
      this.#purchaseView.disableForm();
      this.#calculateAndShowPurchasedLottos();
      this.#winningLottoView.focusInput(0);
    } catch (error) {
      alert(error.message);
      this.#purchaseView.removeInputValue();
      this.#purchaseView.focusInput();
    }
  };
  #handleSubmitWinningLotto = () => {
    try {
      const winningNumbers = this.#winningLottoView.readWinningNumbers();
      winningNumbers.forEach((number) => {
        this.#validateLottoNumber(number);
      });
      Validator.notDuplicated(winningNumbers);
      Validator.arrayLength(winningNumbers, LOTTO.COUNT);
      const bonusNumber = this.#winningLottoView.readBonusNumber();
      this.#validateLottoNumber(bonusNumber);
      this.#winningLotto = new WinningLotto(winningNumbers, bonusNumber);
      this.#winningLottoView.disableInputs();
      this.#calculateAndShowLottoResult();
    } catch (error) {
      alert(error.message);
    }
  };
  #calculateAndShowPurchasedLottos() {
    const purchaseLottoCount = this.#money / LOTTO.PRICE;
    this.#ticketListView.renderPurchaseLottoCount(purchaseLottoCount);
    this.#lottos.push(...LottoGenerator.makeLottos(purchaseLottoCount));
    const allLottoNumbers = this.#lottos.map((lotto) => lotto.getNumbers());
    this.#ticketListView.renderAllTickets(allLottoNumbers);
    this.#ticketListView.show();
    this.#winningLottoView.show();
  }
  #calculateAndShowLottoResult() {
    const allRankCount = ScoreBoard.makeAllRankCount(
      this.#lottos,
      this.#winningLotto
    );
    const scoreData = Object.entries(RANK).map(([_, rank]) => {
      return {
        matchCount: rank.MATCH_COUNT,
        mustHaveBonus: rank.MUST_HAVE_BONUS,
        price: rank.PRICE,
        winCount: allRankCount[rank.DISPLAY]
      };
    });
    this.#resultModalView.renderScore(scoreData);
    const profitRate = ScoreBoard.getProfitRate(allRankCount, this.#money);
    this.#resultModalView.renderProfitRate(profitRate);
    this.#resultModalView.open();
  }
  #validateLottoNumber(number) {
    Validator.positiveNumber(number);
    Validator.numberLower(LOTTO.LOWER, number);
    Validator.numberUpper(LOTTO.UPPER, number);
  }
}
const app = new App();
app.run();

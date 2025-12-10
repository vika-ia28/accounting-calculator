// База данных цен и коэффициентов
const pricingData = {
    // Базовые ставки по режимам налогообложения (комфортный тариф)
    taxRates: {
        'usn_income': { base: 4000, min: 3000, max: 6000 },
        'usn_income_expense': { base: 6000, min: 4500, max: 9000 },
        'osno': { base: 10000, min: 7500, max: 15000 },
        'patent': { base: 3500, min: 2500, max: 5000 },
        'esh': { base: 5500, min: 4000, max: 8000 }
    },
    
    // Стоимость за документ (комфортный тариф)
    documentRates: {
        perDocument: { base: 30, min: 20, max: 50 },
        tiers: [
            { max: 50, multiplier: 0.8 },
            { max: 100, multiplier: 1.0 },
            { max: 200, multiplier: 1.3 },
            { max: 500, multiplier: 1.8 }
        ]
    },
    
    // Стоимость за сотрудника (комфортный тариф)
    employeeRates: {
        perEmployee: { base: 700, min: 500, max: 1200 },
        tiers: [
            { max: 5, multiplier: 1.0 },
            { max: 10, multiplier: 0.9 },
            { max: 20, multiplier: 0.8 },
            { max: 50, multiplier: 0.7 }
        ]
    },
    
    // Стоимость за банк (комфортный тариф)
    bankRates: {
        perBank: { base: 1000, min: 800, max: 2000 },
        firstBankFree: true
    },
    
    // Дополнительные услуги (комфортный тариф)
    additionalServices: {
        'customs': { base: 5000, min: 4000, max: 8000 },
        'marketplaces': { base: 3000, min: 2000, max: 5000 },
        'foreign': { base: 4000, min: 3000, max: 7000 },
        'liquidation': { base: 15000, min: 10000, max: 25000 },
        'reporting': { base: 2000, min: 1500, max: 3000 }
    },
    
    // Коэффициенты для тарифов
    coefficients: {
        min: 0.7,    // Минимальный тариф = комфортный * 0.7
        optimal: 1.0, // Комфортный тариф
        max: 1.5     // Премиум тариф = комфортный * 1.5
    }
};

// DOM элементы
const elements = {
    taxMode: document.getElementById('taxMode'),
    documents: document.getElementById('documents'),
    documentsValue: document.getElementById('documentsValue'),
    employees: document.getElementById('employees'),
    employeesValue: document.getElementById('employeesValue'),
    banks: document.getElementById('banks'),
    banksValue: document.getElementById('banksValue'),
    serviceCheckboxes: document.querySelectorAll('.service-checkbox'),
    calculateBtn: document.getElementById('calculateBtn'),
    optimalPrice: document.getElementById('optimalPrice'),
    rangeMin: document.querySelector('#rangeMin .range-price'),
    rangeOptimal: document.querySelector('#rangeOptimal .range-price'),
    rangeMax: document.querySelector('#rangeMax .range-price'),
    calculationTable: document.querySelector('#calculationTable tbody'),
    resetBtn: document.getElementById('resetBtn'),
    shareBtn: document.getElementById('shareBtn')
};

// Инициализация слайдеров
function initializeSliders() {
    // Слайдер документов
    elements.documents.addEventListener('input', function() {
        elements.documentsValue.textContent = this.value;
        calculatePrice(); // Авторасчет при изменении
    });
    
    // Слайдер сотрудников
    elements.employees.addEventListener('input', function() {
        const value = parseInt(this.value);
        elements.employeesValue.textContent = value + ' ' + getRussianWord(value, 'сотрудник', 'сотрудника', 'сотрудников');
        calculatePrice(); // Авторасчет при изменении
    });
    
    // Слайдер банков
    elements.banks.addEventListener('input', function() {
        const value = parseInt(this.value);
        elements.banksValue.textContent = value + ' ' + getRussianWord(value, 'банк', 'банка', 'банков');
        calculatePrice(); // Авторасчет при изменении
    });
}

// Функция для правильного склонения русских слов
function getRussianWord(number, one, two, five) {
    let n = Math.abs(number);
    n %= 100;
    if (n >= 5 && n <= 20) {
        return five;
    }
    n %= 10;
    if (n === 1) {
        return one;
    }
    if (n >= 2 && n <= 4) {
        return two;
    }
    return five;
}

// Расчет стоимости документов с учетом объема
function calculateDocumentCost(docCount, tariff = 'optimal') {
    const baseRate = pricingData.documentRates.perDocument.base;
    let multiplier = 1.0;
    
    // Применяем множитель в зависимости от объема
    for (const tier of pricingData.documentRates.tiers) {
        if (docCount <= tier.max) {
            multiplier = tier.multiplier;
            break;
        }
    }
    
    let cost = docCount * baseRate * multiplier;
    
    // Применяем коэффициент тарифа
    cost *= pricingData.coefficients[tariff];
    
    return Math.round(cost);
}

// Расчет стоимости сотрудников с учетом количества
function calculateEmployeeCost(empCount, tariff = 'optimal') {
    const baseRate = pricingData.employeeRates.perEmployee.base;
    let multiplier = 1.0;
    
    // Применяем множитель в зависимости от количества
    for (const tier of pricingData.employeeRates.tiers) {
        if (empCount <= tier.max) {
            multiplier = tier.multiplier;
            break;
        }
    }
    
    let cost = empCount * baseRate * multiplier;
    
    // Применяем коэффициент тарифа
    cost *= pricingData.coefficients[tariff];
    
    return Math.round(cost);
}

// Расчет стоимости банков
function calculateBankCost(bankCount, tariff = 'optimal') {
    const baseRate = pricingData.bankRates.perBank.base;
    let effectiveCount = bankCount;
    
    // Первый банк может быть бесплатным
    if (pricingData.bankRates.firstBankFree && bankCount > 0) {
        effectiveCount = bankCount - 1;
    }
    
    let cost = Math.max(0, effectiveCount) * baseRate;
    
    // Применяем коэффициент тарифа
    cost *= pricingData.coefficients[tariff];
    
    return Math.round(cost);
}

// Расчет дополнительных услуг
function calculateAdditionalServices(selectedServices, tariff = 'optimal') {
    let total = 0;
    const services = [];
    
    selectedServices.forEach(service => {
        if (pricingData.additionalServices[service]) {
            const cost = pricingData.additionalServices[service].base * pricingData.coefficients[tariff];
            total += Math.round(cost);
            services.push({
                name: getServiceName(service),
                cost: Math.round(cost)
            });
        }
    });
    
    return { total, services };
}

// Получение имени услуги
function getServiceName(key) {
    const names = {
        'customs': 'Таможня и ВЭД',
        'marketplaces': 'Маркетплейсы',
        'foreign': 'Иностранные сотрудники',
        'liquidation': 'Ликвидация/Реорганизация',
        'reporting': 'Сдача нулевой отчётности'
    };
    return names[key] || key;
}

// Форматирование числа с пробелами
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Основная функция расчета
function calculatePrice() {
    console.log('Расчет начат...'); // Для отладки
    
    // Получаем значения из формы
    const taxMode = elements.taxMode.value;
    const docCount = parseInt(elements.documents.value);
    const empCount = parseInt(elements.employees.value);
    const bankCount = parseInt(elements.banks.value);
    
    console.log('Параметры:', { taxMode, docCount, empCount, bankCount });
    
    // Получаем выбранные дополнительные услуги
    const selectedServices = Array.from(elements.serviceCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    
    console.log('Услуги:', selectedServices);
    
    // Расчет для трех тарифов
    const tariffs = ['min', 'optimal', 'max'];
    const results = {};
    
    tariffs.forEach(tariff => {
        // Базовая ставка по налогообложению
        const baseTaxCost = pricingData.taxRates[taxMode].base * pricingData.coefficients[tariff];
        
        // Стоимость документов
        const docCost = calculateDocumentCost(docCount, tariff);
        
        // Стоимость сотрудников
        const empCost = calculateEmployeeCost(empCount, tariff);
        
        // Стоимость банков
        const bankCost = calculateBankCost(bankCount, tariff);
        
        // Стоимость дополнительных услуг
        const addServices = calculateAdditionalServices(selectedServices, tariff);
        
        // Итоговая стоимость
        const total = Math.round(baseTaxCost + docCost + empCost + bankCost + addServices.total);
        
        results[tariff] = {
            total: total,
            details: {
                tax: Math.round(baseTaxCost),
                documents: docCost,
                employees: empCost,
                banks: bankCost,
                additional: addServices
            }
        };
        
        console.log(`Тариф ${tariff}:`, results[tariff]);
    });
    
    // Обновление интерфейса
    updateUI(results);
}

// Обновление интерфейса с результатами
function updateUI(results) {
    console.log('Обновление UI:', results);
    
    // Основная цена (оптимальный тариф)
    if (elements.optimalPrice) {
        elements.optimalPrice.textContent = `${formatNumber(results.optimal.total)} ₽`;
    }
    
    // Цены по тарифам
    if (elements.rangeMin) {
        elements.rangeMin.textContent = `${formatNumber(results.min.total)} ₽`;
    }
    
    if (elements.rangeOptimal) {
        elements.rangeOptimal.textContent = `${formatNumber(results.optimal.total)} ₽`;
    }
    
    if (elements.rangeMax) {
        elements.rangeMax.textContent = `${formatNumber(results.max.total)} ₽`;
    }
    
    // Детализация расчета (для оптимального тарифа)
    updateCalculationTable(results.optimal);
}

// Обновление таблицы детализации
function updateCalculationTable(result) {
    if (!elements.calculationTable) return;
    
    const details = result.details;
    const tbody = elements.calculationTable;
    tbody.innerHTML = '';
    
    // Базовая ставка
    addTableRow('Базовая ставка (режим налогообложения)', '-', `${formatNumber(details.tax)} ₽`);
    
    // Документы
    addTableRow('Обработка документов', `${elements.documents.value} шт.`, `${formatNumber(details.documents)} ₽`);
    
    // Сотрудники
    addTableRow('Ведение сотрудников', `${elements.employees.value} чел.`, `${formatNumber(details.employees)} ₽`);
    
    // Банки
    addTableRow('Обслуживание банков', `${elements.banks.value} шт.`, `${formatNumber(details.banks)} ₽`);
    
    // Дополнительные услуги
    if (details.additional.services.length > 0) {
        details.additional.services.forEach(service => {
            addTableRow(service.name, 'доп. услуга', `${formatNumber(service.cost)} ₽`);
        });
    } else {
        addTableRow('Дополнительные услуги', 'не выбраны', `0 ₽`);
    }
    
    // Итоговая строка
    addTableRow('ИТОГО', '', `${formatNumber(result.total)} ₽`, true);
}

// Добавление строки в таблицу
function addTableRow(parameter, value, cost, isTotal = false) {
    const row = document.createElement('tr');
    if (isTotal) {
        row.style.fontWeight = 'bold';
        row.style.background = 'linear-gradient(135deg, rgba(67, 97, 238, 0.1) 0%, rgba(114, 9, 183, 0.1) 100%)';
    }
    
    row.innerHTML = `
        <td>${parameter}</td>
        <td>${value}</td>
        <td>${cost}</td>
    `;
    
    if (elements.calculationTable) {
        elements.calculationTable.appendChild(row);
    }
}

// Сброс формы
function resetForm() {
    elements.documents.value = 50;
    elements.documentsValue.textContent = '50';
    
    elements.employees.value = 3;
    elements.employeesValue.textContent = '3 сотрудника';
    
    elements.banks.value = 1;
    elements.banksValue.textContent = '1 банк';
    
    elements.taxMode.value = 'usn_income';
    
    elements.serviceCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    calculatePrice();
}

// Поделиться результатом
function shareResult() {
    const price = elements.optimalPrice.textContent;
    const text = `💰 Рассчитал стоимость бухгалтерских услуг: ${price}/мес\n✨ Посчитайте и вы: ${window.location.href}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Калькулятор бухуслуг',
            text: text,
            url: window.location.href
        });
    } else {
        // Копирование в буфер
        navigator.clipboard.writeText(text).then(() => {
            alert('Ссылка скопирована в буфер!');
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница загружена');
    
    // Инициализация слайдеров
    if (elements.documents && elements.employees && elements.banks) {
        initializeSliders();
    }
    
    // Расчет при загрузке
    calculatePrice();
    
    // Обработчик кнопки расчета
    if (elements.calculateBtn) {
        elements.calculateBtn.addEventListener('click', calculatePrice);
    }
    
    // Перерасчет при изменении любых параметров
    if (elements.taxMode) {
        elements.taxMode.addEventListener('change', calculatePrice);
    }
    
    if (elements.serviceCheckboxes.length > 0) {
        elements.serviceCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', calculatePrice);
        });
    }
    
    // Кнопка сброса
    if (elements.resetBtn) {
        elements.resetBtn.addEventListener('click', resetForm);
    }
    
    // Кнопка поделиться
    if (elements.shareBtn) {
        elements.shareBtn.addEventListener('click', shareResult);
    }
    
    // Показываем, что скрипт загружен
    console.log('Скрипт инициализирован');
});

// Фолбэк если DOMContentLoaded не сработал
setTimeout(function() {
    if (document.querySelector('#optimalPrice').textContent === '0 ₽') {
        console.log('Принудительный перерасчет...');
        calculatePrice();
    }
}, 1000);

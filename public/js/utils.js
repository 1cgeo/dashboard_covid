function numberWithPoint(x) {
    if (x === 'Sem dados') {
        return x
    }
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function deepCopy(data) {
    return JSON.parse(JSON.stringify(data))
}

function getMax(items) {
    return items.reduce((acc, val) => {
        acc = (isNaN(acc) || val > acc) ? val : acc
        return acc;
    })
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function mFormatter(num) {
    if (Math.abs(num) > 999999) {
        return Math.sign(num) * ((Math.abs(num) / 1000000).toFixed(1)) + ' mi'
    } else if (Math.abs(num) > 999 && Math.abs(num) < 999999) {
        return Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + ' mil'
    } else {
        return Math.sign(num) * Math.abs(num)
    }
}

const copyStyles = (source, target, whiteListCssTag = []) => {
    const copyCss = (s, t) => {
        const computed = window.getComputedStyle(s);
        const css = {};
        for (let i = 0; i < computed.length; i++) {
            css[computed[i]] = computed.getPropertyValue(computed[i]);
        }
        for (const key in css) {
            if (whiteListCssTag.length > 0 && whiteListCssTag.includes(key)) {
                t.style[key] = css[key]
            } else if (whiteListCssTag.length == 0) {
                t.style[key] = css[key]
            }
        }
        return css;
    };

    const s = document.querySelector(source);
    const t = document.querySelector(target);
    copyCss(s, t);
    s.querySelectorAll('*').forEach((elt, i) => {
        var childrens = t.querySelectorAll('*')
        copyCss(elt, childrens[i])
    });
};
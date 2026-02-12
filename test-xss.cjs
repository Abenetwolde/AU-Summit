const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const payloads = [
    {
        name: 'Simple Script',
        input: '<script>alert("xss")</script>',
        expected: ''
    },
    {
        name: 'Attribute-based XSS',
        input: '<img src=x onerror=alert(1)>',
        expected: '<img src="x">'
    },
    {
        name: 'Safe HTML',
        input: '<p>Hello <b>World</b></p>',
        expected: '<p>Hello <b>World</b></p>'
    },
    {
        name: 'Complex Nesting',
        input: '<div><svg/onload=alert(1)><a href="javascript:alert(1)">Click me</a></div>',
        expected: '<div><a>Click me</a></div>'
    }
];

function runTests() {
    console.log('--- Running Frontend XSS Sanitizer Tests ---');

    payloads.forEach(payload => {
        const sanitized = DOMPurify.sanitize(payload.input, {
            ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'img'],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class', 'target']
        });
        console.log(`[${payload.name}]`);
        console.log(`  Input:    ${payload.input}`);
        console.log(`  Output:   ${sanitized}`);

        const success = !sanitized.includes('onload') && !sanitized.includes('javascript:') && !sanitized.includes('<script');
        console.log(`  Result:   ${success ? '✅ PASSED' : '❌ FAILED'}`);
    });
}

runTests();

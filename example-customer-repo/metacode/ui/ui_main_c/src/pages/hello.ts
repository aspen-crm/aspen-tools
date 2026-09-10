import { definePage } from '@aspen-crm/sdk';

export const helloPage = definePage(({ element }) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = 'Hello from Aspen.';
    element.append(paragraph);

    return { unmount: () => paragraph.remove() };
});

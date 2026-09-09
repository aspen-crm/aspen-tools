import { Container, Text, Title } from '@mantine/core';
import { definePage } from '@veeva/x-sdk';
import AppProvider, { withAppProvider } from '../../common/components/app-provider/AppProvider';

export const HomePage = () => (
    <AppProvider>
        <Container>
            <Title order={1}>Hello, Aspen</Title>
            <Text>Your app is live. Replace this page with your own.</Text>
        </Container>
    </AppProvider>
);

export const Component = definePage(withAppProvider(HomePage));

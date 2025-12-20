import emailjs from '@emailjs/browser';

// Placeholder credentials - In a real app, these should be in environment variables
const SERVICE_ID = 'service_placeholder';
const TEMPLATE_ID = 'template_placeholder';
const PUBLIC_KEY = 'public_key_placeholder';

export const initEmailJS = () => {
    emailjs.init(PUBLIC_KEY);
};

export const sendApprovalEmail = async (journalistName: string, recipientEmail: string = 'abnetwoldedev@gmail.com') => {
    try {
        const templateParams = {
            to_name: journalistName,
            to_email: recipientEmail,
            message: `Congratulations! Your journalist accreditation entry has been approved. Please find your digital badge details attached.`,
            // Mocking a badge link as a placeholder for actual attachment
            badge_link: 'https://example.com/badge-sample.pdf'
        };

        const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
        console.log('Email sent successfully!', response.status, response.text);
        return { success: true, response };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
};

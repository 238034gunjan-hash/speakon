FROM nginx:stable-alpine

# Copy static frontend files into nginx html directory
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["sh", "-c", "printf \"window.SPEAKON_API_BASE_URL = '%s';\\n\" \"$API_BASE_URL\" > /usr/share/nginx/html/config.js && nginx -g 'daemon off;'"]

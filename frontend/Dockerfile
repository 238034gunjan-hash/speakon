FROM nginx:stable-alpine

# Copy static frontend files into nginx html directory
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

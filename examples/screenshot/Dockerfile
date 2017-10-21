FROM ubuntu

RUN apt-get update
RUN apt-get -y install chromium-browser curl xvfb ttf-wqy-microhei ttf-wqy-zenhei
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs
# RUN apt-get install -y vim
ADD . /home/screenshot
WORKDIR /home/screenshot
RUN npm install
RUN chmod +x ./run.sh

# すべてのファイルの権限を公開用に変更するスクリプト

# htmlファイルの権限
chmod 744 *.html

# テキストファイルの権限
chmod 744 *.txt

# cssファイルの権限
chmod 711 css
chmod 744 ./css/*.css

# jsファイルの権限
chmod 711 js
chmod 744 ./js/*.js

# phpファイルの権限
chmod 711 php
chmod 744 ./php/*.php
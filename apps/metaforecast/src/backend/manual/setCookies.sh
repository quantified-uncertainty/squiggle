#!/usr/bin/bash
clear
echo "
Platforms:
[0]: INFER
[1]: Good Judgment Open
"
read -p "Choose a platform [0/1]: " platform
echo ""
case $platform in
    "0" )
        echo "Platform: INFER"
        echo "Copy request headers from https://www.infer-pub.com/"
        firefox "https://www.infer-pub.com/"
        echo "Copy the request headers to clipboard"
        read -p "Press any key when copied: " copied
        cookie=$(xclip -selection c -o | {
                while IFS= read -r line; do 
                    if [[ "$line" == *"Cookie:"* ]]; then
                        #echo "Found cookie!"
                        # echo "$line"
                        cookie="$(echo $line |sed 's|Cookie: ||' )"
                        #echo "Cookie: $cookie"
                    fi
                done
                echo "$cookie"
            }
        )
        ## Has to deal with https://unix.stackexchange.com/questions/9954/why-is-my-variable-local-in-one-while-read-loop-but-not-in-another-seemingly
        echo ""
        echo "Cookie found:"
        echo "$cookie"
        echo "Running: \$heroku config:set INFER_COOKIE='\$cookie'"
        heroku config:set INFER_COOKIE="$cookie" -a metaforecast-backend
        
        echo "WARNING! This cookie also needs to be updated in QURI 1Password vault, or it will be overwritten by Terraform."
    ;;
    "1" )
        echo "Platform: Good Judgment Open"
        echo "Copy request headers from https://www.gjopen.com/questions/"
        firefox "https://www.gjopen.com/questions/"
        echo "Copy the request headers to clipboard"
        read -p "Press any key when copied: " copied
        cookie=$(xclip -selection c -o | {
                while IFS= read -r line; do 
                    if [[ "$line" == *"Cookie:"* ]]; then
                        #echo "Found cookie!"
                        # echo "$line"
                        cookie="$(echo $line |sed 's|Cookie: ||' )"
                        #echo "Cookie: $cookie"
                    fi
                done
                echo "$cookie"
            }
        )
        echo ""
        echo "Cookie found:"
        echo "$cookie"
        echo "Running: \$heroku config:set GOODJUDGMENTOPENCOOKIE='\$cookie'"
        heroku config:set GOODJUDGMENTOPENCOOKIE="$cookie" -a metaforecast-backend

        echo "WARNING! This cookie also needs to be updated in QURI 1Password vault, or it will be overwritten by Terraform."
    ;;
    * )
        echo "Option not in {0,1}, exiting."
    ;;
esac

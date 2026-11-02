# Print the pixel font as one JS constant for build.sh: PIXEL_FONT_DATA = data URL of fonts/Cubic_11.woff2 (俐方體11號, SIL OFL, see fonts/OFL.txt)
import base64,os
f=os.path.join(os.path.dirname(__file__),'..','fonts','Cubic_11.woff2')
print("const PIXEL_FONT_DATA='data:font/woff2;base64,"+base64.b64encode(open(f,'rb').read()).decode()+"';")

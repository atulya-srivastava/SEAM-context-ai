import React from 'react'
import { BorderBeam } from './ui/border-beam';

function BeamingIcon() {
  return (
    <div className="relative inline-block">
      <div className="p-[3px] rounded-2xl border-white/10 border-[0.5px] low-hidden">
        <BorderBeam
          size={32}
          initialOffset={2}
          className="from-white via-white/2 to-transparent"
        />

        <div className="p-[3px] rounded-2xl border-white/10 border-[0.5px] relative overflow-hidden">
          <BorderBeam
            size={30}
            initialOffset={4}
            className="from-white via-white/2 to-transparent"
          />

          <div className="p-[3px] rounded-2xl border-white/8 border-[0.5px]  relative overflow-hidden">
            <BorderBeam
              size={28}
              initialOffset={5}
              className="from-white to-transparent"
            />

            <div className="bg-gradient-to-br from-purple-500 via-pink-400 to-orange-300 text-white border-transparent rounded-2xl w-18 h-18 flex items-center justify-center">
              {/* <Zap className="" /> */}
              <img
                className="w-12 h-12 m-auto backdrop-blur-sm"
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAABOUlEQVR4nMWUvUoDURSEvxgtFCSWRps8hZW1QrARm9hspY9goRbxDawMwWdQEMFGU2gKCxFsJAgR0SqCtQQirrIwwhLu/ty9uzhwiz07Z85hZ+7CP2MCuAF+Up5r2wGrFuLB6dkOOFXjbgynDDyJ59mIzwMj4AtYiOF5Eu8DkzYD9tV4UsT2JeBZjStFbP9n7ouSlOv2ac31sm5flbkjGR2FXkRUO0kD9lKYiy6VacAtCegbmrox/A3gU7xLoJI0wPRreIvg7gDf4hwDU1iiqebWWD0w9UjvfOCAjLiXSD1UmwUuVB8Cm1nFq9ou+L4zqi0CDxL/AJZxwLaEzvS8BAxUewRqOOJcYlvAeigpV8Ccq/i0BH3g0DUpJqyNxdR3SYoJ7ZD4EGiQM14l/i5zc0dw5e/ySErh+AVgSICoOBF5jAAAAABJRU5ErkJggg=="
                alt="lightning-bolt--v1"
                width={30}
                height={30}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BeamingIcon
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTaskGroupModalComponent } from './edit-task-group-modal.component';

describe('EditTaskGroupModalComponent', () => {
  let component: EditTaskGroupModalComponent;
  let fixture: ComponentFixture<EditTaskGroupModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditTaskGroupModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditTaskGroupModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
